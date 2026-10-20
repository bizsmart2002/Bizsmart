import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditService } from '../common/audit/audit.service';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.roles.find();
  }

  async assignPermissions(roleId: number, permissionCodes: string[], actingUserId: number) {
    const role = await this.roles.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    const permissions = await this.permissions.find({ where: { code: In(permissionCodes) } });
    if (permissions.length !== permissionCodes.length) {
      throw new BadRequestException('Uno o más códigos de permiso no existen');
    }

    role.permissions = permissions;
    const saved = await this.roles.save(role);

    await this.audit.log({
      userId: actingUserId,
      action: 'PERMISSION_CHANGE',
      entity: 'Role',
      entityId: role.id,
      details: { role: role.name, permissions: permissionCodes },
    });

    return saved;
  }
}
