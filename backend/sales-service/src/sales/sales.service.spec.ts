import { BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from '../sale-details/entities/sale-detail.entity';

// ------------------------------------------------------------------
// SalesService es el caso más interesante para probar en BizSmart
// porque NO habla solo con su propia base de datos: orquesta
// llamadas HTTP a product-service, inventory-service y
// customer-service (arquitectura de microservicios, ver Fase 1).
// Para probarlo sin levantar los otros 7 servicios ni Docker, se
// mockea HttpService por completo y se simulan sus respuestas con
// RxJS `of()` (éxito) / `throwError()` (fallo) — así se verifica el
// flujo de negocio descrito en la sección 10 de la especificación:
// validar productos -> validar stock -> calcular total -> registrar
// venta -> descontar inventario.
// ------------------------------------------------------------------

describe('SalesService', () => {
  let service: SalesService;
  let salesRepo: { save: jest.Mock; create: jest.Mock; find: jest.Mock; findOne: jest.Mock };
  let saleDetailsRepo: { save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let httpService: { get: jest.Mock; post: jest.Mock };

  const product = {
    id: 10,
    name: 'Gaseosa 400ml',
    price: '2500.00',
    minimumStock: 20,
    active: true,
  };

  beforeEach(async () => {
    salesRepo = {
      save: jest.fn((x) => Promise.resolve({ id: 1, ...x })),
      create: jest.fn((x) => x),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 1, customerId: null, sellerId: 3, total: 5000 }),
    };
    saleDetailsRepo = {
      save: jest.fn((x) => Promise.resolve(x)),
      create: jest.fn((x) => x),
      find: jest.fn().mockResolvedValue([]),
    };
    httpService = { get: jest.fn(), post: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: salesRepo },
        { provide: getRepositoryToken(SaleDetail), useValue: saleDetailsRepo },
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { get: (_: string, def: string) => def } },
      ],
    }).compile();

    service = module.get(SalesService);
  });

  afterEach(() => jest.clearAllMocks());

  const mockHappyPath = () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('by-ids')) return of({ data: [product] });
      if (url.includes('check-stock')) return of({ data: { sufficient: true } });
      return of({ data: {} });
    });
    httpService.post.mockReturnValue(of({ data: { ok: true } }));
  };

  it('registra una venta válida: calcula el total y descuenta inventario', async () => {
    mockHappyPath();

    await service.create({ items: [{ productId: 10, quantity: 2 }] } as any, 3, 'Bearer fake-token');

    expect(salesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 5000, total: 5000, sellerId: 3 }),
    );
    // se descuenta el inventario llamando al endpoint de inventory-service
    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('/inventory/movements/sale'),
      expect.objectContaining({ productId: 10, quantity: 2 }),
      expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } }),
    );
  });

  it('rechaza la venta si el producto no existe', async () => {
    httpService.get.mockImplementation((url: string) =>
      url.includes('by-ids') ? of({ data: [] }) : of({ data: { sufficient: true } }),
    );

    await expect(
      service.create({ items: [{ productId: 999, quantity: 1 }] } as any, 3, 'Bearer x'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(salesRepo.save).not.toHaveBeenCalled(); // no se registra una venta inválida
  });

  it('rechaza la venta si el producto está desactivado', async () => {
    httpService.get.mockImplementation((url: string) =>
      url.includes('by-ids') ? of({ data: [{ ...product, active: false }] }) : of({ data: { sufficient: true } }),
    );

    await expect(
      service.create({ items: [{ productId: 10, quantity: 1 }] } as any, 3, 'Bearer x'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza la venta si no hay stock suficiente (HU07)', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('by-ids')) return of({ data: [product] });
      if (url.includes('check-stock')) return of({ data: { sufficient: false } });
      return of({ data: {} });
    });

    await expect(
      service.create({ items: [{ productId: 10, quantity: 100 }] } as any, 3, 'Bearer x'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(salesRepo.save).not.toHaveBeenCalled();
    expect(httpService.post).not.toHaveBeenCalled(); // nunca llega a descontar inventario
  });

  it('rechaza la venta si el cliente indicado no existe en customer-service', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('/customers/')) return throwError(() => new Error('404'));
      return of({ data: [] });
    });

    await expect(
      service.create({ customerId: 777, items: [{ productId: 10, quantity: 1 }] } as any, 3, 'Bearer x'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calcula correctamente el subtotal con varias líneas de productos', async () => {
    const productB = { id: 11, name: 'Agua 600ml', price: '1800.00', minimumStock: 15, active: true };
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('by-ids')) return of({ data: [product, productB] });
      if (url.includes('check-stock')) return of({ data: { sufficient: true } });
      return of({ data: {} });
    });
    httpService.post.mockReturnValue(of({ data: { ok: true } }));

    await service.create(
      {
        items: [
          { productId: 10, quantity: 2 }, // 2 * 2500 = 5000
          { productId: 11, quantity: 1 }, // 1 * 1800 = 1800
        ],
      } as any,
      3,
      'Bearer x',
    );

    expect(salesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ subtotal: 6800, total: 6800 }));
  });
});
