import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthUser } from '../../../models/auth.model';
import { AuthService } from '../services/auth.service';

// HU02 - paso 3: Google ya autenticó al usuario y el backend (auth-service)
// redirigió aquí con el token en la URL: /oauth-callback?token=...
// Este componente solo pide /auth/me con ese token, arma la sesión igual
// que un login normal, y manda al usuario al dashboard.
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="wrapper">
      @if (error()) {
        <p class="error">No se pudo completar el inicio de sesión con Google. Intenta de nuevo.</p>
      } @else {
        <mat-spinner diameter="36"></mat-spinner>
        <p>Completando el inicio de sesión con Google…</p>
      }
    </div>
  `,
  styles: [`
    .wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; background: #f5f5f5; }
    .error { color: #b00020; max-width: 320px; text-align: center; }
  `],
})
export class OAuthCallbackComponent implements OnInit {
  error = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.auth.completeOAuthLogin(token).subscribe({
      next: (user: AuthUser) => {
        this.auth.setSession({ accessToken: token, user });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
    });
  }
}
