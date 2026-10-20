import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // No exponer detalles internos (stack traces, causa exacta) al cliente.
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}
