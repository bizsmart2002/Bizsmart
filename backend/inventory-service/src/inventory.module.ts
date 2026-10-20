import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from './common/auth/auth-shared.module';
import { Alert } from './alerts/entities/alert.entity';
import { AlertsController } from './alerts/alerts.controller';
import { Inventory } from './inventory/entities/inventory.entity';
import { InventoryMovement } from './movements/entities/inventory-movement.entity';
import { InventoryController } from './movements/inventory.controller';
import { InventoryService } from './movements/inventory.service';
import { ProductRef } from './products-ref/product-ref.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, InventoryMovement, Alert, ProductRef]),
    AuthSharedModule,
  ],
  controllers: [InventoryController, AlertsController],
  providers: [InventoryService],
})
export class InventoryDomainModule {}
