import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from './common/auth/auth-shared.module';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { Customer } from './customers/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), HttpModule, AuthSharedModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersDomainModule {}
