import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../alerts/entities/alert.entity';
import { ProductRef } from '../products-ref/product-ref.entity';
import { RegisterMovementDto, RegisterSaleMovementDto } from './dto/register-movement.dto';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(InventoryMovement) private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
    @InjectRepository(ProductRef) private readonly productsRef: Repository<ProductRef>,
  ) {}

  findAll() {
    return this.inventoryRepo.find({ order: { productId: 'ASC' } });
  }

  async findByProduct(productId: number) {
    const product = await this.productsRef.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.getOrCreateInventory(productId);
  }

  findMovements(productId?: number) {
    return this.movementRepo.find({
      where: productId ? { productId } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  /** HU06: entradas/salidas/ajustes manuales -> solo ADMIN/OWNER. */
  async registerManualMovement(dto: RegisterMovementDto, createdBy: number) {
    const product = await this.productsRef.findOne({ where: { id: dto.productId } });
    if (!product) throw new BadRequestException('Producto no existe en el catálogo');

    return this.applyMovement({
      productId: dto.productId,
      movementType: dto.movementType,
      quantity: dto.quantity,
      reference: dto.reference ?? null,
      createdBy,
      minimumStock: product.minimumStock,
    });
  }

  /** HU07/HU12: descuento automático de stock al registrar una venta (invocado por sales-service). */
  async registerSaleMovement(dto: RegisterSaleMovementDto) {
    return this.applyMovement({
      productId: dto.productId,
      movementType: 'SALE',
      quantity: dto.quantity,
      reference: dto.reference,
      createdBy: dto.createdBy,
      minimumStock: dto.minimumStock,
    });
  }

  async resolveAlert(id: number) {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');
    alert.resolved = true;
    alert.resolvedAt = new Date();
    return this.alertRepo.save(alert);
  }

  findAlerts(onlyUnresolved = true) {
    return this.alertRepo.find({
      where: onlyUnresolved ? { resolved: false } : {},
      order: { createdAt: 'DESC' },
    });
  }

  // --------------------------------------------------------------
  // HU07 (venta) valida stock disponible ANTES de vender; este método
  // se usa para esa validación previa sin registrar el movimiento aún.
  // --------------------------------------------------------------
  async hasSufficientStock(productId: number, quantity: number): Promise<boolean> {
    const inventory = await this.getOrCreateInventory(productId);
    return inventory.currentStock >= quantity;
  }

  private async getOrCreateInventory(productId: number): Promise<Inventory> {
    let inventory = await this.inventoryRepo.findOne({ where: { productId } });
    if (!inventory) {
      inventory = await this.inventoryRepo.save(
        this.inventoryRepo.create({ productId, currentStock: 0 }),
      );
    }
    return inventory;
  }

  private async applyMovement(params: {
    productId: number;
    movementType: MovementType;
    quantity: number;
    reference: string | null;
    createdBy: number;
    minimumStock: number;
     }) {
    const inventory = await this.getOrCreateInventory(params.productId);
    const previousStock = inventory.currentStock;

    const isOutbound = params.movementType === 'OUT' || params.movementType === 'SALE';
    const newStock = isOutbound
      ? previousStock - params.quantity
      : previousStock + params.quantity;

    if (newStock < 0) {
      throw new BadRequestException('El producto no posee stock suficiente');
    }

    inventory.currentStock = newStock;
    await this.inventoryRepo.save(inventory);

    const movement = await this.movementRepo.save(
      this.movementRepo.create({
        productId: params.productId,
        movementType: params.movementType,
        quantity: params.quantity,
        previousStock,
        newStock,
        reference: params.reference ?? undefined,
        createdBy: params.createdBy,
      }),
    );

    // HU11: alerta automática cuando se alcanza el stock mínimo.
    let alertCreated = false;
    if (newStock <= params.minimumStock) {
      const existingUnresolved = await this.alertRepo.findOne({
        where: { productId: params.productId, resolved: false },
      });
      if (!existingUnresolved) {
        await this.alertRepo.save(
          this.alertRepo.create({
            productId: params.productId,
            alertType: 'LOW_STOCK',
            message: `El producto #${params.productId} alcanzó el stock mínimo (actual: ${newStock}, mínimo: ${params.minimumStock})`,
            resolved: false,
          }),
        );
        alertCreated = true;
      }
    }

    return { inventory, movement, alertCreated };
  }
}
 