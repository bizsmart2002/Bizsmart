import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/auth/jwt-payload.interface';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

// HU05: registrar productos. Consulta abierta a todos los roles autenticados
// (Consultar productos: ADMIN/OWNER/SELLER/VIEWER = ✔ en la matriz de la ERS).
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.service.findAll(active === 'true');
  }

  @Get('by-ids')
  findManyByIds(@Query('ids') ids: string) {
    // usado por sales-service: GET /products/by-ids?ids=1,2,3
    const parsed = ids.split(',').map((id) => parseInt(id, 10));
    return this.service.findManyByIds(parsed);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OWNER')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OWNER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.userId);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN', 'OWNER')
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.service.deactivate(id, user.userId);
  }
}
