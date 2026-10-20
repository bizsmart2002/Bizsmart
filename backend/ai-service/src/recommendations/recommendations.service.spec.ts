import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';

// ------------------------------------------------------------------
// RecommendationsService es la "IA simulada" de BizSmart: reglas
// determinísticas sobre datos reales (ver el comentario del propio
// archivo fuente y el punto 14 de la especificación: "no debe
// inventar cifras que no estén registradas"). Justamente por eso es
// importante probar la lógica de clasificación (texto de la razón,
// umbrales de tendencia UP/DOWN/STABLE) con datos de ejemplo
// controlados, sin depender de que haya ventas reales en la base.
//
// Se mockea DataSource.query (acceso a datos) y se deja correr la
// lógica real de transformación de los resultados.
// ------------------------------------------------------------------

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecommendationsService, { provide: getDataSourceToken(), useValue: dataSource }],
    }).compile();

    service = module.get(RecommendationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('restockRecommendations (HU12)', () => {
    it('marca "Sin existencias disponibles" cuando el stock actual es 0', async () => {
      dataSource.query.mockResolvedValue([
        { id: 1, name: 'Detergente 1kg', currentStock: 0, minimumStock: 8, suggestedReorderQty: 24 },
      ]);

      const result = await service.restockRecommendations();

      expect(result[0].reason).toBe('Sin existencias disponibles');
    });

    it('explica el motivo con las cifras reales cuando el stock está bajo pero no en cero', async () => {
      dataSource.query.mockResolvedValue([
        { id: 2, name: 'Galletas surtidas', currentStock: 5, minimumStock: 20, suggestedReorderQty: 55 },
      ]);

      const result = await service.restockRecommendations();

      expect(result[0].reason).toContain('5');
      expect(result[0].reason).toContain('20');
    });
  });

  describe('salesTrends (HU14)', () => {
    it('clasifica como UP cuando el aumento es de 15% o más respecto al mes anterior', async () => {
      dataSource.query.mockResolvedValue([
        { id: 1, name: 'Gaseosa 400ml', currentMonthUnits: 120, previousMonthUnits: 100 }, // +20%
      ]);

      const [result] = await service.salesTrends();

      expect(result.trend).toBe('UP');
      expect(result.changePct).toBe(20);
    });

    it('clasifica como DOWN cuando la caída es de 15% o más', async () => {
      dataSource.query.mockResolvedValue([
        { id: 1, name: 'Agua 600ml', currentMonthUnits: 60, previousMonthUnits: 100 }, // -40%
      ]);

      const [result] = await service.salesTrends();

      expect(result.trend).toBe('DOWN');
    });

    it('clasifica como STABLE cuando la variación es menor al 15% en cualquier sentido', async () => {
      dataSource.query.mockResolvedValue([
        { id: 1, name: 'Pan tajado', currentMonthUnits: 105, previousMonthUnits: 100 }, // +5%
      ]);

      const [result] = await service.salesTrends();

      expect(result.trend).toBe('STABLE');
    });

    it('no calcula porcentaje (changePct = null) cuando no hubo ventas el mes anterior', async () => {
      dataSource.query.mockResolvedValue([
        { id: 1, name: 'Producto nuevo', currentMonthUnits: 10, previousMonthUnits: 0 },
      ]);

      const [result] = await service.salesTrends();

      expect(result.changePct).toBeNull();
      expect(result.trend).toBe('STABLE'); // sin dato previo no se puede afirmar una tendencia
    });
  });
});
