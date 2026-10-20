import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/auth/jwt-payload.interface';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ReportsService } from './reports.service';

// HU15: reportes -> ADMIN/OWNER completos; VIEWER limitado (reports:read:basic).
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('sales')
  @Roles('ADMIN', 'OWNER', 'VIEWER')
  sales(@Query() filter: ReportFilterDto, @CurrentUser() user: AuthenticatedUser) {
    this.assertFullAccessOrBasic(user);
    return this.service.sales(filter);
  }

  @Get('products')
  @Roles('ADMIN', 'OWNER', 'VIEWER')
  products() {
    return this.service.products();
  }

  @Get('inventory')
  @Roles('ADMIN', 'OWNER', 'VIEWER')
  inventory() {
    return this.service.inventory();
  }

  @Get('customers')
  @Roles('ADMIN', 'OWNER')
  customers() {
    return this.service.customers();
  }

  @Get('top-selling')
  @Roles('ADMIN', 'OWNER', 'VIEWER')
  topSelling(@Query() filter: ReportFilterDto) {
    return this.service.topSellingProducts(filter);
  }

  @Get('trends')
  @Roles('ADMIN', 'OWNER')
  trends() {
    return this.service.trends();
  }

  private assertFullAccessOrBasic(_user: AuthenticatedUser) {
    // Punto de extensión: si en el futuro se requiere recortar campos
    // financieros para VIEWER (reports:read:basic), se hace aquí.
  }
}
