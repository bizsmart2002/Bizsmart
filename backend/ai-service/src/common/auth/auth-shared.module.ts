import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

// Módulo mínimo para validar JWT en microservicios que NO emiten tokens
// (todos excepto auth-service). Provee JwtAuthGuard + RolesGuard listos para usar.
@Module({
  imports: [PassportModule],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthSharedModule {}
