import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuditService } from '../common/audit/audit.service';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

// ------------------------------------------------------------------
// Pruebas unitarias de AuthService (Presenter, patrón MVP backend).
//
// No se usa una base de datos real: los repositorios de TypeORM se
// reemplazan por "mocks" (objetos falsos con jest.fn()) para que la
// prueba sea rápida, repetible y no dependa de Postgres. Esto es lo
// que en el material del curso corresponde a "pruebas unitarias"
// (equivalentes a JUnit en Java o pytest en Python), usando Jest
// porque el stack de BizSmart es NestJS/TypeScript.
// ------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let rolesRepo: { findOne: jest.Mock };
  let auditService: { log: jest.Mock };

  const ownerRole: Partial<Role> = {
    id: 2,
    name: 'OWNER',
    permissions: [{ id: 1, code: 'PRODUCTS_MANAGE' } as any],
  };

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 1,
      name: 'Camila Owner',
      email: 'owner@bizsmart.test',
      passwordHash: null,
      oauthProvider: null,
      oauthId: null,
      role: ownerRole as Role,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  beforeEach(async () => {
    usersRepo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn((x) => x) };
    rolesRepo = { findOne: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Role), useValue: rolesRepo },
        {
          provide: JwtService,
          // sign() real pero determinístico no es necesario: basta con
          // confirmar que se llama con el payload correcto.
          useValue: { sign: jest.fn().mockReturnValue('fake.jwt.token') },
        },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- register (HU01) ----------------
  describe('register', () => {
    it('crea un usuario nuevo con rol OWNER y devuelve un accessToken', async () => {
      usersRepo.findOne.mockResolvedValue(null); // no existe todavía
      rolesRepo.findOne.mockResolvedValue(ownerRole);
      usersRepo.save.mockResolvedValue(buildUser({ email: 'nuevo@bizsmart.test' }));

      const result = await service.register({
        name: 'Nuevo Usuario',
        email: 'nuevo@bizsmart.test',
        password: 'ClaveSegura123',
      } as any);

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(result.user.email).toBe('nuevo@bizsmart.test');
      expect(result.user.role).toBe('OWNER');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'User' }),
      );
    });

    it('rechaza el registro si el correo ya existe (ConflictException)', async () => {
      usersRepo.findOne.mockResolvedValue(buildUser());

      await expect(
        service.register({ name: 'X', email: 'owner@bizsmart.test', password: '123456' } as any),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ---------------- login con contraseña (HU01) ----------------
  describe('login', () => {
    it('devuelve accessToken con credenciales válidas', async () => {
      const hash = await bcrypt.hash('Password123', 10);
      usersRepo.findOne.mockResolvedValue(buildUser({ passwordHash: hash }));

      const result = await service.login({ email: 'owner@bizsmart.test', password: 'Password123' } as any);

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOGIN' }));
    });

    it('rechaza contraseña incorrecta sin revelar si el correo existe', async () => {
      const hash = await bcrypt.hash('Password123', 10);
      usersRepo.findOne.mockResolvedValue(buildUser({ passwordHash: hash }));

      await expect(
        service.login({ email: 'owner@bizsmart.test', password: 'incorrecta' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza login si el usuario no existe', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nadie@bizsmart.test', password: 'x' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza login por contraseña en una cuenta creada solo por OAuth (sin password_hash)', async () => {
      usersRepo.findOne.mockResolvedValue(buildUser({ passwordHash: null, oauthProvider: 'google' }));

      await expect(
        service.login({ email: 'owner@bizsmart.test', password: 'cualquiera' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza login si el usuario está desactivado', async () => {
      const hash = await bcrypt.hash('Password123', 10);
      usersRepo.findOne.mockResolvedValue(buildUser({ passwordHash: hash, active: false }));

      await expect(
        service.login({ email: 'owner@bizsmart.test', password: 'Password123' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // ---------------- login con OAuth / Google (HU02) ----------------
  describe('loginWithOAuthProfile', () => {
    const profile = {
      provider: 'google' as const,
      oauthId: 'google-id-123',
      email: 'nuevo.oauth@bizsmart.test',
      name: 'Usuario Google',
    };

    it('crea una cuenta nueva (rol OWNER, sin password_hash) en el primer login con Google', async () => {
      usersRepo.findOne
        .mockResolvedValueOnce(null) // no existe por (provider, oauthId)
        .mockResolvedValueOnce(null); // tampoco existe por email
      rolesRepo.findOne.mockResolvedValue(ownerRole);
      usersRepo.save.mockResolvedValue(
        buildUser({ email: profile.email, passwordHash: null, oauthProvider: 'google', oauthId: profile.oauthId }),
      );

      const result = await service.loginWithOAuthProfile(profile);

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: null, oauthProvider: 'google' }),
      );
    });

    it('es idempotente: un segundo login con el mismo perfil reutiliza la cuenta sin crear otra', async () => {
      const existing = buildUser({
        email: profile.email,
        oauthProvider: 'google',
        oauthId: profile.oauthId,
      });
      usersRepo.findOne.mockResolvedValueOnce(existing); // ya existe por (provider, oauthId)

      await service.loginWithOAuthProfile(profile);

      expect(usersRepo.save).not.toHaveBeenCalled(); // no se vuelve a crear/guardar
    });

    it('vincula la identidad de Google a una cuenta existente con el mismo correo, sin perder su contraseña', async () => {
      const existingPasswordAccount = buildUser({
        email: profile.email,
        passwordHash: 'hash-existente',
        oauthProvider: null,
        oauthId: null,
      });
      usersRepo.findOne
        .mockResolvedValueOnce(null) // no existe por (provider, oauthId)
        .mockResolvedValueOnce(existingPasswordAccount); // sí existe por email
      usersRepo.save.mockImplementation((u) => Promise.resolve(u));

      await service.loginWithOAuthProfile(profile);

      const savedUser = usersRepo.save.mock.calls[0][0];
      expect(savedUser.passwordHash).toBe('hash-existente'); // la contraseña no se borra
      expect(savedUser.oauthProvider).toBe('google');
    });

    it('rechaza el login si la cuenta vinculada está desactivada', async () => {
      usersRepo.findOne.mockResolvedValueOnce(
        buildUser({ oauthProvider: 'google', oauthId: profile.oauthId, active: false }),
      );

      await expect(service.loginWithOAuthProfile(profile)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
