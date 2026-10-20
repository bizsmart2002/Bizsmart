import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from './common/auth/auth-shared.module';
import { SaleDetail } from './sale-details/entities/sale-detail.entity';
import { Sale } from './sales/entities/sale.entity';
import { SalesController } from './sales/sales.controller';
import { SalesService } from './sales/sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleDetail]),
    HttpModule,
    AuthSharedModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesDomainModule {}
