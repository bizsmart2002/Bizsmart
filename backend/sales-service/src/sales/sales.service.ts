import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { SaleDetail } from '../sale-details/entities/sale-detail.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';

interface ProductInfo {
  id: number;
  name: string;
  price: string; // numeric llega como string desde Postgres/TypeORM
  minimumStock: number;
  active: boolean;
}

// Presenter del dominio "ventas". Sigue el flujo definido en la Fase 1 /
// especificación original, sección 10:
// validar usuario/permisos (Guards) -> validar productos -> validar stock ->
// calcular subtotal/total -> registrar venta+detalle -> actualizar inventario.
@Injectable()
export class SalesService {
  private readonly productServiceUrl: string;
  private readonly inventoryServiceUrl: string;
  private readonly customerServiceUrl: string;

  constructor(
    @InjectRepository(Sale) private readonly sales: Repository<Sale>,
    @InjectRepository(SaleDetail) private readonly saleDetails: Repository<SaleDetail>,
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.productServiceUrl = config.get<string>('PRODUCT_SERVICE_URL', 'http://localhost:3002');
    this.inventoryServiceUrl = config.get<string>('INVENTORY_SERVICE_URL', 'http://localhost:3003');
    this.customerServiceUrl = config.get<string>('CUSTOMER_SERVICE_URL', 'http://localhost:3005');
  }

  findAll(sellerId?: number) {
    return this.sales.find({
      where: sellerId ? { sellerId } : {},
      order: { saleDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const sale = await this.sales.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    const details = await this.saleDetails.find({ where: { saleId: id } });
    return { ...sale, details };
  }

  findByCustomer(customerId: number) {
    // usado por customer-service para el historial de compras (HU09/3.2.6)
    return this.sales.find({ where: { customerId }, order: { saleDate: 'DESC' } });
  }

  async create(dto: CreateSaleDto, sellerId: number, authHeader: string) {
    if (dto.customerId) {
      await this.assertCustomerExists(dto.customerId, authHeader);
    }

    const ids = dto.items.map((i) => i.productId);
    const products = await this.fetchProducts(ids, authHeader);

    // 1) validar productos: existen, activos
    // NOTA: product.id llega desde product-service como STRING (columna
    // `bigint` de Postgres: TypeORM/pg la serializa como string para no
    // perder precisión en JS), mientras item.productId es number (DTO
    // @IsInt()). Se normaliza con Number() antes de comparar.
    for (const item of dto.items) {
      const product = products.find((p) => Number(p.id) === item.productId);
      if (!product) {
        throw new BadRequestException(`El producto ${item.productId} no existe`);
      }
      if (!product.active) {
        throw new BadRequestException(`El producto "${product.name}" está desactivado`);
      }
    }

    // 2) validar stock disponible para cada línea
    for (const item of dto.items) {
      const sufficient = await this.checkStock(item.productId, item.quantity, authHeader);
      if (!sufficient) {
        const product = products.find((p) => Number(p.id) === item.productId);
        throw new BadRequestException(
          `El producto "${product?.name ?? item.productId}" no posee stock suficiente`,
        );
      }
    }

    // 3) calcular subtotal/total
    const lines = dto.items.map((item) => {
      const product = products.find((p) => Number(p.id) === item.productId)!;
      const unitPrice = parseFloat(product.price);
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      return { ...item, unitPrice, subtotal, product };
    });
    const subtotal = Number(lines.reduce((acc, l) => acc + l.subtotal, 0).toFixed(2));
    const total = subtotal; // sin impuestos/descuentos en esta versión

    // 4) registrar venta + detalle
    const sale = await this.sales.save(
      this.sales.create({
        customerId: dto.customerId ?? null,
        sellerId,
        saleDate: new Date(),
        subtotal,
        total,
        status: 'COMPLETED',
      }),
    );

    await this.saleDetails.save(
      lines.map((l) =>
        this.saleDetails.create({
          saleId: sale.id,
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          subtotal: l.subtotal,
        }),
      ),
    );

    // 5) actualizar inventario (descuenta stock, registra movimiento SALE,
    //    evalúa stock mínimo y genera alerta si corresponde - HU11)
    for (const l of lines) {
      await firstValueFrom(
        this.http.post(
          `${this.inventoryServiceUrl}/inventory/movements/sale`,
          {
            productId: l.productId,
            quantity: l.quantity,
            minimumStock: l.product.minimumStock,
            reference: `SALE-${sale.id}`,
            createdBy: sellerId,
          },
          { headers: { Authorization: authHeader } },
        ),
      );
    }

    return this.findOne(sale.id);
  }

  private async fetchProducts(ids: number[], authHeader: string): Promise<ProductInfo[]> {
    const { data } = await firstValueFrom(
      this.http.get<ProductInfo[]>(`${this.productServiceUrl}/products/by-ids`, {
        params: { ids: ids.join(',') },
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  private async checkStock(productId: number, quantity: number, authHeader: string): Promise<boolean> {
    const { data } = await firstValueFrom(
      this.http.get<{ sufficient: boolean }>(`${this.inventoryServiceUrl}/inventory/check-stock`, {
        params: { productId, quantity },
        headers: { Authorization: authHeader },
      }),
    );
    return data.sufficient;
  }

  private async assertCustomerExists(customerId: number, authHeader: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.get(`${this.customerServiceUrl}/customers/${customerId}`, {
          headers: { Authorization: authHeader },
        }),
      );
    } catch {
      throw new BadRequestException('El cliente indicado no existe');
    }
  }
}
