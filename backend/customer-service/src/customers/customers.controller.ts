import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomersService } from './customers.service';

// HU09: Gestionar clientes -> OWNER y SELLER (ver matriz ERS).
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @Roles('OWNER', 'SELLER')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('OWNER', 'SELLER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'SELLER')
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('OWNER', 'SELLER')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Get(':id/purchases')
  @Roles('OWNER', 'SELLER')
  purchaseHistory(@Param('id', ParseIntPipe) id: number, @Headers('authorization') authHeader: string) {
    return this.service.purchaseHistory(id, authHeader);
  }
}
