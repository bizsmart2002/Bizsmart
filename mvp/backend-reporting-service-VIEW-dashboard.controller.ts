import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/auth/jwt-payload.interface';
import { DashboardService } from './dashboard.service';

// HU10: dashboard -> ADMIN/OWNER completo; SELLER/VIEWER básico (⚠ en la ERS).
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @Roles('ADMIN', 'OWNER', 'SELLER', 'VIEWER')
  async summary(@CurrentUser() user: AuthenticatedUser) {
    const full = await this.service.summary();

    const isBasic =
      (user.role === 'SELLER' || user.role === 'VIEWER') &&
      !user.permissions.includes('dashboard:read');

    if (!isBasic) return full;

    // Alcance reducido (dashboard:read:basic): sin cifras totales del negocio,
    // solo lo operativo (productos más vendidos y alertas activas).
    return {
      topProducts: full.topProducts,
      activeAlertsCount: full.activeAlertsCount,
    };
  }
}
