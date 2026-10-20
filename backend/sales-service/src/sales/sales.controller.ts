import { Body, Controller, Get, Headers, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/auth/jwt-payload.interface';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly service: SalesService) {}

  // Consultar ventas: ADMIN/OWNER ven todas; SELLER solo las propias (sales:read:own, ⚠ ERS).
  @Get()
  @Roles('ADMIN', 'OWNER', 'SELLER')
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('customerId') customerId?: string) {
    if (customerId) {
      return this.service.findByCustomer(parseInt(customerId, 10));
    }
    const scopedToSelf = user.role === 'SELLER' && !user.permissions.includes('sales:read');
    return this.service.findAll(scopedToSelf ? user.userId : undefined);
  }

  @Get(':id')
  @Roles('ADMIN', 'OWNER', 'SELLER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // HU07: registrar venta -> OWNER/SELLER (sales:create).
  @Post()
  @Roles('OWNER', 'SELLER')
  create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authHeader: string,
  ) {
    // user.userId viene del claim `sub` del JWT, que a su vez es
    // auth.users.id (columna `bigint` de Postgres -> TypeORM lo serializa
    // como STRING). Se normaliza aquí porque sales.service reenvía este
    // valor como `createdBy` a inventory-service, cuyo DTO exige @IsInt()
    // (number estricto, sin @Type/transform) y rechazaría el string con 400.
    return this.service.create(dto, Number(user.userId), authHeader);
  }
}
