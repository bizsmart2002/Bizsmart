import { Module } from '@nestjs/common';
import { AuthSharedModule } from './common/auth/auth-shared.module';
import { AgentController } from './agent/agent.controller';
import { AgentService } from './agent/agent.service';
import { RecommendationsController } from './recommendations/recommendations.controller';
import { RecommendationsService } from './recommendations/recommendations.service';

@Module({
  imports: [AuthSharedModule],
  controllers: [AgentController, RecommendationsController],
  providers: [AgentService, RecommendationsService],
})
export class AiDomainModule {}
