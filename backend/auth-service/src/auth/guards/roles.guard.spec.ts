import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../jwt-payload.interface';

// ------------------------------------------------------------------
// RolesGuard es el corazón del control de acceso basado en roles de
// BizSmart (ver Fase 1, sección "Seguridad"): decide si una petición
// HTTP sigue adelante según el rol/permisos del usuario autenticado
// (puestos en el request por JwtAuthGuard). Probarlo aisladamente
// evita tener que levantar un servicio HTTP completo solo para
// validar esta regla de negocio.
// ------------------------------------------------------------------

function buildContext(user: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  const seller: AuthenticatedUser = {
    userId: 3,
    email: 'seller@bizsmart.test',
    role: 'SELLER',
    permissions: ['SALES_CREATE', 'PRODUCTS_VIEW'],
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite el acceso cuando el handler no tiene @Roles() ni @Permissions()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(buildContext(seller))).toBe(true);
  });

  it('permite el acceso cuando el rol del usuario está en @Roles()', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === ROLES_KEY ? ['SELLER', 'OWNER'] : undefined));

    expect(guard.canActivate(buildContext(seller))).toBe(true);
  });

  it('rechaza con ForbiddenException cuando el rol no está permitido (ej. ADMIN intentando vender, HU07)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === ROLES_KEY ? ['SELLER', 'OWNER'] : undefined));

    const admin: AuthenticatedUser = { ...seller, role: 'ADMIN', permissions: [] };

    expect(() => guard.canActivate(buildContext(admin))).toThrow(ForbiddenException);
  });

  it('permite el acceso cuando el usuario tiene todos los @Permissions() requeridos', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === PERMISSIONS_KEY ? ['SALES_CREATE'] : undefined));

    expect(guard.canActivate(buildContext(seller))).toBe(true);
  });

  it('rechaza cuando falta al menos uno de los @Permissions() requeridos', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === PERMISSIONS_KEY ? ['SALES_CREATE', 'REPORTS_VIEW'] : undefined));

    expect(() => guard.canActivate(buildContext(seller))).toThrow(ForbiddenException);
  });
});
