import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { ProductRef } from '../products-ref/product-ref.entity';

// ------------------------------------------------------------------
// InventoryService concentra las reglas de negocio más sensibles de
// BizSmart: el stock nunca puede quedar negativo (HU07/HU12) y debe
// generarse una alerta automática la primera vez que un producto
// llega a su stock mínimo (HU11), sin duplicar alertas mientras siga
// sin resolverse. Son justo las reglas que conviene cubrir con
// pruebas unitarias (no con pruebas manuales), porque un error aquí
// significa vender stock que no existe o perder la alerta de
// reabastecimiento.
// ------------------------------------------------------------------

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let movementRepo: { save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let alertRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let productsRefRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    inventoryRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
      create: jest.fn((x) => x),
      find: jest.fn(),
    };
    movementRepo = { save: jest.fn((x) => Promise.resolve(x)), create: jest.fn((x) => x), find: jest.fn() };
    alertRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
      create: jest.fn((x) => x),
      find: jest.fn(),
    };
    productsRefRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Inventory), useValue: inventoryRepo },
        { provide: getRepositoryToken(InventoryMovement), useValue: movementRepo },
        { provide: getRepositoryToken(Alert), useValue: alertRepo },
        { provide: getRepositoryToken(ProductRef), useValue: productsRefRepo },
      ],
    }).compile();

    service = module.get(InventoryService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerManualMovement (HU06: entradas/salidas/ajustes manuales)', () => {
    it('una entrada (IN) aumenta el stock actual', async () => {
      productsRefRepo.findOne.mockResolvedValue({ id: 1, minimumStock: 10 });
      inventoryRepo.findOne.mockResolvedValue({ id: 1, productId: 1, currentStock: 50 });
      alertRepo.findOne.mockResolvedValue(null);

      const result = await service.registerManualMovement(
        { productId: 1, movementType: 'IN', quantity: 20 } as any,
        99,
      );

      expect(result.inventory.currentStock).toBe(70);
      expect(result.alertCreated).toBe(false);
    });

    it('rechaza el movimiento si no hay stock suficiente para una salida (OUT)', async () => {
      productsRefRepo.findOne.mockResolvedValue({ id: 1, minimumStock: 10 });
      inventoryRepo.findOne.mockResolvedValue({ id: 1, productId: 1, currentStock: 5 });

      await expect(
        service.registerManualMovement({ productId: 1, movementType: 'OUT', quantity: 8 } as any, 99),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(movementRepo.save).not.toHaveBeenCalled(); // no se registra el movimiento inválido
    });

    it('rechaza el movimiento si el producto no existe en el catálogo de referencia', async () => {
      productsRefRepo.findOne.mockResolvedValue(null);

      await expect(
        service.registerManualMovement({ productId: 999, movementType: 'IN', quantity: 5 } as any, 99),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('genera una alerta LOW_STOCK la primera vez que el stock llega al mínimo', async () => {
      productsRefRepo.findOne.mockResolvedValue({ id: 1, minimumStock: 10 });
      inventoryRepo.findOne.mockResolvedValue({ id: 1, productId: 1, currentStock: 12 });
      alertRepo.findOne.mockResolvedValue(null); // sin alerta previa sin resolver

      const result = await service.registerManualMovement(
        { productId: 1, movementType: 'OUT', quantity: 3 } as any, // 12 - 3 = 9 <= 10 (mínimo)
        99,
      );

      expect(result.inventory.currentStock).toBe(9);
      expect(result.alertCreated).toBe(true);
      expect(alertRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 1, alertType: 'LOW_STOCK', resolved: false }),
      );
    });

    it('no duplica la alerta si ya existe una sin resolver para el mismo producto', async () => {
      productsRefRepo.findOne.mockResolvedValue({ id: 1, minimumStock: 10 });
      inventoryRepo.findOne.mockResolvedValue({ id: 1, productId: 1, currentStock: 9 });
      alertRepo.findOne.mockResolvedValue({ id: 5, productId: 1, resolved: false }); // ya existe

      const result = await service.registerManualMovement(
        { productId: 1, movementType: 'IN', quantity: 1 } as any,
        99,
      );

      expect(result.alertCreated).toBe(false);
      expect(alertRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('registerSaleMovement (HU07/HU12: descuento automático por venta)', () => {
    it('descuenta el stock usando el tipo de movimiento SALE', async () => {
      inventoryRepo.findOne.mockResolvedValue({ id: 2, productId: 4, currentStock: 30 });
      alertRepo.findOne.mockResolvedValue(null);

      const result = await service.registerSaleMovement({
        productId: 4,
        quantity: 2,
        minimumStock: 5,
        reference: 'SALE-100',
        createdBy: 3,
      } as any);

      expect(result.inventory.currentStock).toBe(28);
      expect(movementRepo.save).toHaveBeenCalledWith(expect.objectContaining({ movementType: 'SALE' }));
    });

    it('rechaza la venta si deja el stock negativo', async () => {
      inventoryRepo.findOne.mockResolvedValue({ id: 2, productId: 4, currentStock: 1 });

      await expect(
        service.registerSaleMovement({
          productId: 4,
          quantity: 5,
          minimumStock: 5,
          reference: 'SALE-101',
          createdBy: 3,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('hasSufficientStock', () => {
    it('devuelve true cuando el stock alcanza', async () => {
      inventoryRepo.findOne.mockResolvedValue({ productId: 1, currentStock: 10 });
      await expect(service.hasSufficientStock(1, 5)).resolves.toBe(true);
    });

    it('devuelve false cuando el stock no alcanza', async () => {
      inventoryRepo.findOne.mockResolvedValue({ productId: 1, currentStock: 2 });
      await expect(service.hasSufficientStock(1, 5)).resolves.toBe(false);
    });

    it('crea el registro de inventario en 0 si el producto todavía no tiene uno (primer movimiento)', async () => {
      inventoryRepo.findOne.mockResolvedValue(null);
      inventoryRepo.save.mockResolvedValue({ productId: 7, currentStock: 0 });

      const result = await service.hasSufficientStock(7, 1);

      expect(inventoryRepo.save).toHaveBeenCalledWith(expect.objectContaining({ productId: 7 }));
      expect(result).toBe(false); // 0 >= 1 es falso
    });
  });

  describe('resolveAlert', () => {
    it('marca una alerta como resuelta', async () => {
      alertRepo.findOne.mockResolvedValue({ id: 5, resolved: false });

      const result = await service.resolveAlert(5);

      expect(result.resolved).toBe(true);
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('lanza NotFoundException si la alerta no existe', async () => {
      alertRepo.findOne.mockResolvedValue(null);
      await expect(service.resolveAlert(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
