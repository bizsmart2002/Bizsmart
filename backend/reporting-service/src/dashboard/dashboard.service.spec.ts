import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';

// reporting-service es de solo lectura sobre los esquemas de los demás
// dominios (ver comentario en el propio Service). Se mockea DataSource.query
// en el orden exacto en que el Service la invoca (totales, top productos,
// stock bajo, tendencia 7 días, alertas activas) para comprobar que arma
// bien el objeto final que consume el Dashboard del frontend.
describe('DashboardService', () => {
  let service: DashboardService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: getDataSourceToken(), useValue: dataSource }],
    }).compile();

    service = module.get(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  it('arma el resumen combinando las 5 consultas agregadas', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ totalSales: 23300, salesCount: 4 }]) // totales
      .mockResolvedValueOnce([{ id: 10, name: 'Gaseosa 400ml', unitsSold: 4 }]) // top productos
      .mockResolvedValueOnce([{ id: 11, name: 'Jugo de mango 250ml', currentStock: 8, minimumStock: 10 }]) // stock bajo
      .mockResolvedValueOnce([{ day: '2026-10-12', total: 5000 }]) // tendencia 7 días
      .mockResolvedValueOnce([{ count: 3 }]); // alertas activas

    const summary = await service.summary();

    expect(summary.totalSales).toBe(23300);
    expect(summary.salesCount).toBe(4);
    expect(summary.topProducts).toHaveLength(1);
    expect(summary.lowStockProducts[0].currentStock).toBe(8);
    expect(summary.activeAlertsCount).toBe(3);
  });

  it('devuelve activeAlertsCount en 0 cuando la consulta no trae filas', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ totalSales: 0, salesCount: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]); // sin filas

    const summary = await service.summary();

    expect(summary.activeAlertsCount).toBe(0);
  });
});
