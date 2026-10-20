import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';
import { LoginPresenter } from '../presenters/login.presenter';

// View (MVP): solo formulario + delega en el Presenter. Sin lógica de negocio.
@Component({
  selector: 'app-login',
  standalone: true,
  providers: [LoginPresenter],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <div class="login-logo">
          <img src="assets/logo.png" alt="BizSmart" />
        </div>
        <mat-card-header>
          <mat-card-title>BizSmart</mat-card-title>
          <mat-card-subtitle>Inicia sesión para continuar</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email" required />
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" required />
            </mat-form-field>

            @if (presenter.errorMessage()) {
              <p class="error">{{ presenter.errorMessage() }}</p>
            }

            <button
              mat-flat-button
              color="primary"
              class="full-width"
              type="submit"
              [disabled]="form.invalid || presenter.loading()"
            >
              @if (presenter.loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Iniciar sesión
              }
            </button>
          </form>

          <div class="divider"><span>o</span></div>

          <a mat-stroked-button class="full-width google-btn" [href]="googleLoginUrl">
            Continuar con Google
          </a>
        </mat-card-content>
        <mat-card-footer class="footer-link">
          ¿Aún no tienes un negocio registrado?
          <a routerLink="/register">Regístrate</a>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; }
    .login-card { width: 360px; padding: 8px; }
    .login-logo { text-align: center; padding-top: 16px; }
    .login-logo img { max-width: 140px; width: 100%; height: auto; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .error { color: #b00020; font-size: 0.9rem; margin: 0 0 8px; }
    .divider { display: flex; align-items: center; text-align: center; color: rgba(0,0,0,0.5); font-size: 0.8rem; margin: 12px 0; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid rgba(0,0,0,0.12); }
    .divider span { padding: 0 10px; }
    .google-btn { display: flex; align-items: center; justify-content: center; text-decoration: none; }
    .footer-link { padding: 16px; text-align: center; font-size: 0.85rem; }
  `],
})
export class LoginComponent {
  // Navegación de página completa a propósito (no una llamada de Angular):
  // el flujo de Google necesita que el propio navegador visite esta URL.
  readonly googleLoginUrl = `${environment.apiUrl}/auth/google`;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    readonly presenter: LoginPresenter,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.presenter.submit(this.form.getRawValue() as any);
  }
}
