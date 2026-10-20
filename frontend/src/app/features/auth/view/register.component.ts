import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../services/auth.service';

// HU01/registro: da de alta al propietario de un nuevo negocio (rol OWNER).
// HU02: registrarse con Google hace exactamente lo mismo (crea el negocio
// como OWNER) sin necesidad de inventar una contraseña.
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="wrapper">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Crea tu negocio en BizSmart</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Nombre completo</mat-label>
              <input matInput formControlName="name" required />
            </mat-form-field>
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email" required />
            </mat-form-field>
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" required />
            </mat-form-field>
            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }
            <button mat-flat-button color="primary" class="full-width" type="submit" [disabled]="form.invalid">
              Registrarme
            </button>
          </form>

          <div class="divider"><span>o</span></div>

          <a mat-stroked-button class="full-width google-btn" [href]="googleLoginUrl">
            Continuar con Google
          </a>
        </mat-card-content>
        <mat-card-footer class="footer-link">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrapper { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
    .card { width: 380px; padding: 8px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .error { color: #b00020; font-size: 0.9rem; }
    .footer-link { padding: 16px; text-align: center; font-size: 0.85rem; }
    .divider { display: flex; align-items: center; text-align: center; color: rgba(0,0,0,0.5); font-size: 0.8rem; margin: 12px 0; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid rgba(0,0,0,0.12); }
    .divider span { padding: 0 10px; }
    .google-btn { display: flex; align-items: center; justify-content: center; text-decoration: none; }
  `],
})
export class RegisterComponent {
  readonly googleLoginUrl = `${environment.apiUrl}/auth/google`;
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.router.navigate(['/dashboard']);
      },
      error: () => this.errorMessage.set('No se pudo completar el registro. ¿El correo ya está en uso?'),
    });
  }
}
