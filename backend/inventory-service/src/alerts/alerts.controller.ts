import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { InventoryService } from '../movements/inventory.service';

// HU11: recibir alertas -> visible para ADMIN (supervisión) y OWNER (accionable).
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @Roles('ADMIN', 'OWNER')
  findAll(@Query('all') all?: string) {
    return this.service.findAlerts(all !== 'true');
  }

  @Patch(':id/resolve')
  @Roles('ADMIN', 'OWNER')
  resolve(@Param('id', ParseIntPipe) id: number) {
    return this.service.resolveAlert(id);
  }
}
