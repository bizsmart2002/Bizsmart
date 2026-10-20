import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuditService } from '../common/audit/audit.service';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto, actingUserId: number) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('El correo ya está registrado');

    const role = await this.roles.findOne({ where: { name: dto.roleName } });
    if (!role) throw new BadRequestException('Rol inválido');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save(
      this.users.create({ name: dto.name, email: dto.email, passwordHash, role, active: true }),
    );

    await this.audit.log({
      userId: actingUserId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: role.name },
    });

    return user;
  }

  async update(id: number, dto: UpdateUserDto, actingUserId: number) {
    const user = await this.findOne(id);

    if (dto.name) user.name = dto.name;
    if (typeof dto.active === 'boolean') user.active = dto.active;

    let roleChanged = false;
    if (dto.roleName && dto.roleName !== user.role.name) {
      const role = await this.roles.findOne({ where: { name: dto.roleName } });
      if (!role) throw new BadRequestException('Rol inválido');
      user.role = role;
      roleChanged = true;
    }

    const saved = await this.users.save(user);

    await this.audit.log({
      userId: actingUserId,
      action: roleChanged ? 'ROLE_CHANGE' : 'UPDATE',
      entity: 'User',
      entityId: saved.id,
      details: { name: saved.name, active: saved.active, role: saved.role.name },
    });

    return saved;
  }

  async deactivate(id: number, actingUserId: number) {
    const user = await this.findOne(id);
    user.active = false;
    const saved = await this.users.save(user);

    await this.audit.log({
      userId: actingUserId,
      action: 'DEACTIVATE',
      entity: 'User',
      entityId: saved.id,
    });

    return saved;
  }
}
