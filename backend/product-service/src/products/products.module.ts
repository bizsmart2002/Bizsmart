import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../common/audit/audit.module';
import { AuthSharedModule } from '../common/auth/auth-shared.module';
import { Category } from '../categories/entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category]), AuditModule, AuthSharedModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
