import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuditService } from '../common/audit/audit.service';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { OAuthProfile } from './strategies/google.strategy';
import { AuthenticatedUser, JwtPayload } from './jwt-payload.interface';

// Presenter (patrón MVP en el backend): recibe la intención desde el
// Controller (View del backend), coordina el Model (repositorios) y
// prepara la respuesta. No conoce nada de HTTP.
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Ya existe un usuario registrado con ese correo');
    }

    const ownerRole = await this.roles.findOne({ where: { name: 'OWNER' } });
    if (!ownerRole) {
      throw new Error('Rol OWNER no existe. Verifique el seed de la base de datos.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save(
      this.users.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: ownerRole,
        active: true,
      }),
    );

    await this.audit.log({
      userId: user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: 'OWNER', via: 'self-register' },
    });

    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.users.findOne({ where: { email: dto.email } });

    // Una cuenta creada solo por Google no tiene password_hash: no puede
    // "adivinarse" una contraseña que nunca existió, así que se rechaza
    // igual que unas credenciales inválidas (sin filtrar que la cuenta existe).
    if (!user || !user.active || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    return this.toAuthResponse(user);
  }

  // HU02: entra o se registra un usuario a partir de un perfil ya
  // verificado por el proveedor externo (Google). Nunca se maneja ni se
  // guarda una contraseña en este flujo.
  async loginWithOAuthProfile(profile: OAuthProfile, ipAddress?: string) {
    let user = await this.users.findOne({
      where: { oauthProvider: profile.provider, oauthId: profile.oauthId },
    });

    if (!user) {
      // ¿Ya existe una cuenta con ese correo (creada con clave)? Si es así,
      // se vincula la identidad de Google a esa cuenta en vez de duplicarla.
      user = await this.users.findOne({ where: { email: profile.email } });

      if (user) {
        user.oauthProvider = profile.provider;
        user.oauthId = profile.oauthId;
        user = await this.users.save(user);

        await this.audit.log({
          userId: user.id,
          action: 'UPDATE',
          entity: 'User',
          entityId: user.id,
          details: { linkedOAuthProvider: profile.provider },
        });
      } else {
        const ownerRole = await this.roles.findOne({ where: { name: 'OWNER' } });
        if (!ownerRole) {
          throw new Error('Rol OWNER no existe. Verifique el seed de la base de datos.');
        }

        user = await this.users.save(
          this.users.create({
            name: profile.name,
            email: profile.email,
            passwordHash: null,
            oauthProvider: profile.provider,
            oauthId: profile.oauthId,
            role: ownerRole,
            active: true,
          }),
        );

        await this.audit.log({
          userId: user.id,
          action: 'CREATE',
          entity: 'User',
          entityId: user.id,
          details: { email: user.email, role: 'OWNER', via: `oauth:${profile.provider}` },
        });
      }
    }

    if (!user.active) {
      throw new UnauthorizedException('El usuario está desactivado');
    }

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { via: `oauth:${profile.provider}` },
      ipAddress,
    });

    return this.toAuthResponse(user);
  }

  async me(authUser: AuthenticatedUser) {
    const user = await this.users.findOne({ where: { id: authUser.userId } });
    if (!user) throw new UnauthorizedException();
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions?.map((p) => p.code) ?? authUser.permissions,
      active: user.active,
    };
  }

  private toAuthResponse(user: User) {
    const permissions = user.role.permissions?.map((p) => p.code) ?? [];
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name as JwtPayload['role'],
      permissions,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions,
      },
    };
  }
}
