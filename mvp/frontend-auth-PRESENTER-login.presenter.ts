import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginRequest } from '../../../models/auth.model';
import { AuthService } from '../services/auth.service';

// Presenter (MVP, Fase 1 §3): recibe el evento "submit" de la View, llama
// al Model (AuthService), y prepara el estado que la View debe mostrar
// (loading, errorMessage). La View NO llama a AuthService directamente.
@Injectable()
export class LoginPresenter {
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(credentials: LoginRequest): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(credentials).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Correo o contraseña incorrectos.');
      },
    });
  }
}
