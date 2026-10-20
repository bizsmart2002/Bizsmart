import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/auth/jwt-payload.interface';
import { RegisterMovementDto, RegisterSaleMovementDto } from './dto/register-movement.dto';
import { InventoryService } from './inventory.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('inventory')
  findAll() {
    return this.service.findAll(); // consulta abierta (Consultar inventario: todos menos VIEWER-sin-permiso ya filtrado por el Gateway/rol)
  }

  @Get('inventory/:productId')
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.findByProduct(productId);
  }

  @Get('inventory/movements')
  findMovements(@Query('productId') productId?: string) {
    return this.service.findMovements(productId ? parseInt(productId, 10) : undefined);
  }

  // HU06: entradas/salidas/ajustes manuales -> exclusivo ADMIN/OWNER (inventory:manage).
  @Post('inventory/movements')
  @Roles('ADMIN', 'OWNER')
  registerManualMovement(@Body() dto: RegisterMovementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.registerManualMovement(dto, user.userId);
  }

  // Llamado internamente por sales-service al confirmar una venta (HU07/HU12).
  // No se restringe por @Roles porque la autorización de "vender" ya la validó
  // sales-service contra el permiso sales:create del usuario original.
  @Post('inventory/movements/sale')
  registerSaleMovement(@Body() dto: RegisterSaleMovementDto) {
    return this.service.registerSaleMovement(dto);
  }

  @Get('inventory/check-stock')
  async checkStock(@Query('productId', ParseIntPipe) productId: number, @Query('quantity', ParseIntPipe) quantity: number) {
    const sufficient = await this.service.hasSufficientStock(productId, quantity);
    return { productId, quantity, sufficient };
  }
}
