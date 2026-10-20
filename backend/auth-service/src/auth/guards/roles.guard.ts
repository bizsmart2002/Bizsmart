import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles()/@Permissions() en el handler => solo exige estar autenticado.
    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const user: AuthenticatedUser = context.switchToHttp().getRequest().user;

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('El rol del usuario no tiene acceso a este recurso');
    }

    if (requiredPermissions?.length) {
      const hasAll = requiredPermissions.every((p) => user.permissions.includes(p));
      if (!hasAll) {
        throw new ForbiddenException('El usuario no tiene los permisos requeridos');
      }
    }

    return true;
  }
}
