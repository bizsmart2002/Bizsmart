import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { RolesService } from './roles.service';

// HU04: asignar roles y permisos -> exclusivo ADMIN.
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.rolesService.findAll();
  }

  @Patch(':id/permissions')
  @Roles('ADMIN')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    return this.rolesService.assignPermissions(id, dto.permissionCodes, actingUser.userId);
  }
}
