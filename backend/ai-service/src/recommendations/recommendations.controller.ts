import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { RecommendationsService } from './recommendations.service';

// HU12/HU14: recomendaciones y tendencias -> exclusivo OWNER (ai:use).
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get('restock-recommendations')
  @Roles('OWNER')
  restock() {
    return this.service.restockRecommendations();
  }

  @Get('trends')
  @Roles('OWNER')
  trends() {
    return this.service.salesTrends();
  }
}
