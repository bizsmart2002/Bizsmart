import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ProxyService } from './proxy.service';

// ------------------------------------------------------------------
// Estas pruebas automatizan la verificación que, durante el
// desarrollo de BizSmart, se hizo a mano con un servidor HTTP de
// prueba: que el Gateway reenvíe correctamente los redirects 3xx
// (necesarios para el login con Google, HU02) en vez de seguirlos él
// mismo, y que devuelva 503 sin filtrar detalles internos cuando un
// microservicio no responde. Antes esto se comprobó una sola vez de
// forma manual; ahora queda como regla automática que corre en cada
// cambio (ver TESTING.md / pipeline de CI).
// ------------------------------------------------------------------

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
  } as any;
}

describe('ProxyService', () => {
  let service: ProxyService;
  let http: { request: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    http = { request: jest.fn() };
    config = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(ProxyService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('resolveTarget', () => {
    it('resuelve "products" hacia PRODUCT_SERVICE_URL', () => {
      config.get.mockReturnValue('http://product-service:3002');
      expect(service.resolveTarget('products')).toBe('http://product-service:3002');
      expect(config.get).toHaveBeenCalledWith('PRODUCT_SERVICE_URL');
    });

    it('devuelve null para un primer segmento que no está en la tabla de ruteo', () => {
      expect(service.resolveTarget('ruta-inexistente')).toBeNull();
    });
  });

  describe('forward', () => {
    it('responde 404 cuando la ruta no está en la tabla de ruteo', async () => {
      const res = buildRes();
      const req = { path: '/no-existe/x', originalUrl: '/no-existe/x', method: 'GET', headers: {}, body: {} } as any;

      await service.forward(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(http.request).not.toHaveBeenCalled();
    });

    it('reenvía la respuesta normal del microservicio (status + body) sin modificarla', async () => {
      config.get.mockReturnValue('http://auth-service:3001');
      http.request.mockReturnValue(of({ status: 200, data: { ok: true }, headers: {} }));
      const res = buildRes();
      const req = {
        path: '/auth/me',
        originalUrl: '/auth/me',
        method: 'GET',
        headers: { authorization: 'Bearer token' },
        body: {},
      } as any;

      await service.forward(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('reenvía un 3xx con Location como redirect al navegador, sin seguirlo él mismo (HU02: login Google)', async () => {
      config.get.mockReturnValue('http://auth-service:3001');
      http.request.mockReturnValue(
        of({ status: 302, data: {}, headers: { location: 'https://accounts.google.com/o/oauth2/auth' } }),
      );
      const res = buildRes();
      const req = { path: '/auth/google', originalUrl: '/auth/google', method: 'GET', headers: {}, body: {} } as any;

      await service.forward(req, res);

      expect(res.redirect).toHaveBeenCalledWith(302, 'https://accounts.google.com/o/oauth2/auth');
      expect(res.json).not.toHaveBeenCalled(); // no se trata como una respuesta JSON normal
    });

    it('responde 503 sin filtrar detalles internos cuando el microservicio destino no responde', async () => {
      config.get.mockReturnValue('http://sales-service:3004');
      http.request.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));
      const res = buildRes();
      const req = { path: '/sales', originalUrl: '/sales', method: 'GET', headers: {}, body: {} } as any;

      await service.forward(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      const body = res.json.mock.calls[0][0];
      expect(body.message).toContain('sales');
      expect(JSON.stringify(body)).not.toContain('ECONNREFUSED'); // no se expone el error interno
    });
  });
});
