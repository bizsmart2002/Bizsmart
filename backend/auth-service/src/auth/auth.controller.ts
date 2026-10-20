import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './jwt-payload.interface';
import { OAuthProfile } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  // HU02 - paso 1: el navegador entra aquí y Passport lo redirige a
  // la pantalla de consentimiento de Google. No hay lógica propia que
  // ejecutar; el guard hace todo el trabajo.
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Nunca se ejecuta: GoogleAuthGuard intercepta la petición y redirige.
  }

  // HU02 - paso 2: Google redirige aquí después de que el usuario acepta.
  // GoogleAuthGuard ya validó la identidad con Google y la dejó en req.user.
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as OAuthProfile;
    const { accessToken } = await this.authService.loginWithOAuthProfile(profile, req.ip);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:4200');
    res.redirect(`${frontendUrl}/oauth-callback?token=${encodeURIComponent(accessToken)}`);
  }
}
