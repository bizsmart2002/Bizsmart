import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { AuditService } from '../common/audit/audit.service';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';

// ------------------------------------------------------------------
// Pruebas unitarias de ProductsService: catálogo de productos
// (HU03/HU04/HU05 de la especificación). Se mockean los repositorios
// de TypeORM y AuditService para aislar la lógica propia del Service.
// ------------------------------------------------------------------

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    findBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let categoriesRepo: { findOne: jest.Mock };
  let auditService: { log: jest.Mock };

  const category: Partial<Category> = { id: 1, name: 'Bebidas' };

  beforeEach(async () => {
    productsRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findBy: jest.fn(),
      save: jest.fn((x) => Promise.resolve({ id: 1, ...x })),
      create: jest.fn((x) => x),
    };
    categoriesRepo = { findOne: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepo },
        { provide: getRepositoryToken(Category), useValue: categoriesRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('crea un producto activo con categoría válida', async () => {
      categoriesRepo.findOne.mockResolvedValue(category);

      const product = await service.create(
        { name: 'Gaseosa 400ml', price: 2500, minimumStock: 20, categoryId: 1 } as any,
        1,
      );

      expect(product.active).toBe(true);
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }));
    });

    it('rechaza la creación si la categoría indicada no existe', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ name: 'X', price: 100, minimumStock: 1, categoryId: 999 } as any, 1),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(productsRepo.save).not.toHaveBeenCalled();
    });

    it('permite crear un producto sin categoría (categoryId opcional)', async () => {
      const product = await service.create(
        { name: 'Producto sin categoría', price: 100, minimumStock: 1 } as any,
        1,
      );

      expect(categoriesRepo.findOne).not.toHaveBeenCalled();
      expect(product).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el producto no existe', async () => {
      productsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deactivate (baja lógica)', () => {
    it('marca el producto como inactivo sin eliminarlo', async () => {
      productsRepo.findOne.mockResolvedValue({ id: 1, name: 'X', active: true });

      const result = await service.deactivate(1, 1);

      expect(result.active).toBe(false);
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DEACTIVATE' }));
    });
  });

  describe('update', () => {
    it('actualiza solo los campos enviados en el DTO (actualización parcial)', async () => {
      productsRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Nombre viejo',
        price: 1000,
        minimumStock: 5,
        active: true,
      });

      const result = await service.update(1, { price: 1500 } as any, 1);

      expect(result.name).toBe('Nombre viejo'); // no se tocó
      expect(result.price).toBe(1500); // sí se actualizó
    });

    it('rechaza la actualización si la nueva categoría no existe', async () => {
      productsRepo.findOne.mockResolvedValue({ id: 1, name: 'X', active: true });
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, { categoryId: 999 } as any, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findManyByIds (usado por sales-service vía HTTP)', () => {
    it('devuelve los productos cuyo id está en la lista', async () => {
      productsRepo.findBy.mockResolvedValue([{ id: 10 }, { id: 11 }]);

      const result = await service.findManyByIds([10, 11]);

      expect(result).toHaveLength(2);
      expect(productsRepo.findBy).toHaveBeenCalled();
    });
  });
});
