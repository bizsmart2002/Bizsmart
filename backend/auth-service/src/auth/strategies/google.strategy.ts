import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface OAuthProfile {
  provider: 'google';
  oauthId: string;
  email: string;
  name: string;
}

// HU02: "Como usuario, quiero poder autenticarme mediante un proveedor
// externo compatible con OAuth 2.0, para acceder al sistema de manera
// segura sin tener que gestionar otra contraseña."
//
// Esta estrategia SOLO conversa con Google para confirmar la identidad;
// nunca ve ni maneja una contraseña de BizSmart. Quien decide qué hacer
// con esa identidad (crear usuario, vincular uno existente) es
// AuthService, no la estrategia.
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    // Si GOOGLE_CLIENT_ID/SECRET todavía no están configurados (por ejemplo,
    // mientras no se haya creado el proyecto en Google Cloud Console), se usan
    // valores de relleno: la librería exige que estos campos no estén vacíos
    // para arrancar, pero un intento real de login simplemente fallará del
    // lado de Google ("invalid_client") en vez de tumbar todo el servicio.
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', 'not-configured'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', 'not-configured'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('La cuenta de Google no tiene un correo público disponible'), false);
    }

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      oauthId: profile.id,
      email,
      name: profile.displayName || email,
    };
    done(null, oauthProfile);
  }
}
