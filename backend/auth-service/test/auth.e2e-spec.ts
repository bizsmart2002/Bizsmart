import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// Import estilo CommonJS: evita el error TS2349 que da "import * as request"
// con las definiciones de tipos actuales de supertest, sin depender de que
// esModuleInterop esté activado en el tsconfig del servicio.
import request = require('supertest');
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

// ------------------------------------------------------------------
// Prueba de integración HTTP (e2e) del endpoint POST /auth/login.
//
// Es el equivalente, para este stack NestJS, a lo que en el material
// del curso se llama "prueba de API" (como las que se hacen con
// Postman): se manda una petición HTTP real contra la aplicación de
// Nest levantada en memoria (sin red, sin Docker) y se revisa la
// respuesta completa (status code + body), incluyendo la validación
// de los DTO (class-validator) que corre antes de llegar al Service.
//
// AuthService se reemplaza por un mock: lo que se está probando aquí
// es la capa HTTP (ruta, status codes, validación), no la lógica de
// negocio de login (esa ya se cubre en auth.service.spec.ts).
// ------------------------------------------------------------------

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const authServiceMock = {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
    loginWithOAuthProfile: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:4200' } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mismo pipe global que main.ts, para que la prueba refleje el
    // comportamiento real de validación de la API.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  it('POST /auth/login -> 200 y devuelve el token cuando las credenciales son válidas', async () => {
    authServiceMock.login.mockResolvedValue({
      accessToken: 'fake.jwt.token',
      user: { userId: 2, name: 'Camila Owner', email: 'owner@bizsmart.test', role: 'OWNER', permissions: [] },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@bizsmart.test', password: 'Password123' });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBe('fake.jwt.token');
    expect(response.body.user.role).toBe('OWNER');
  });

  it('POST /auth/login -> 401 cuando AuthService rechaza las credenciales', async () => {
    const { UnauthorizedException } = await import('@nestjs/common');
    authServiceMock.login.mockRejectedValue(new UnauthorizedException('Credenciales inválidas'));

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@bizsmart.test', password: 'incorrecta' });

    expect(response.status).toBe(401);
  });

  it('POST /auth/login -> 400 cuando el correo no tiene formato válido (ValidationPipe)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-es-un-correo', password: 'Password123' });

    expect(response.status).toBe(400);
    expect(authServiceMock.login).not.toHaveBeenCalled(); // nunca llega al Service
  });

  it('POST /auth/login -> 400 cuando falta la contraseña', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@bizsmart.test' });

    expect(response.status).toBe(400);
  });

  it('POST /auth/login -> 400 cuando el body trae campos no permitidos (forbidNonWhitelisted)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@bizsmart.test', password: 'Password123', isAdmin: true });

    expect(response.status).toBe(400);
  });
});
