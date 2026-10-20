import { Module } from '@nestjs/common';
import { AuthSharedModule } from './common/auth/auth-shared.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';

@Module({
  imports: [AuthSharedModule],
  controllers: [DashboardController, ReportsController],
  providers: [DashboardService, ReportsService],
})
export class ReportingDomainModule {}
