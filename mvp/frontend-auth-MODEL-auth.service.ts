import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from '../../../models/auth.model';

const STORAGE_KEY = 'bizsmart_session';

// Model del frontend (Fase 5): HTTP + estado de sesión en memoria.
// Se persiste en sessionStorage (no localStorage) solo para sobrevivir a un
// refresh de página, priorizando reducir superficie de XSS (ver Fase 1 §6).
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.restore()?.user ?? null);
  private _token: string | null = this.restore()?.accessToken ?? null;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return this._token;
  }

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload);
  }

  register(payload: RegisterRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/register`, payload);
  }

  // HU02: el backend ya validó al usuario con Google y nos entregó un JWT
  // por la URL (ver OAuthCallbackComponent). Falta pedir /auth/me con ese
  // token para saber quién es (nombre, rol, permisos) y completar la sesión
  // exactamente igual que con un login por correo y contraseña.
  completeOAuthLogin(token: string) {
    this._token = token; // necesario ANTES de la llamada: el interceptor JWT lo toma de aquí
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`);
  }

  setSession(response: LoginResponse) {
    this._token = response.accessToken;
    this._user.set(response.user);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response));
  }

  logout() {
    this._token = null;
    this._user.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  hasRole(...roles: string[]): boolean {
    const role = this._user()?.role;
    return !!role && roles.includes(role);
  }

  hasPermission(permission: string): boolean {
    return !!this._user()?.permissions.includes(permission);
  }

  private restore(): LoginResponse | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
