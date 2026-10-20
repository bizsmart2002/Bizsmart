import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { Roles } from '../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/auth/jwt-payload.interface';
import { AgentService } from './agent.service';
import { AskAgentDto } from './dto/ask-agent.dto';

// HU13: consultar agente inteligente -> OWNER (agent:use) completo,
// SELLER con alcance reducido (agent:use:basic, ⚠ en la ERS).
@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Post('ask')
  @Roles('OWNER', 'SELLER')
  ask(@Body() dto: AskAgentDto, @CurrentUser() user: AuthenticatedUser) {
    const scope = user.permissions.includes('agent:use') ? 'FULL' : 'BASIC';
    return this.service.ask(dto.question, scope);
  }
}
