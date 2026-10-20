import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../features/auth/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: string[];
}

// La View oculta/deshabilita opciones según el rol SOLO por UX (Fase 1 §5);
// el backend es quien realmente protege cada endpoint.
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['ADMIN', 'OWNER', 'SELLER', 'VIEWER'] },
  { label: 'Productos', path: '/products', icon: 'inventory_2', roles: ['ADMIN', 'OWNER', 'SELLER', 'VIEWER'] },
  { label: 'Inventario', path: '/inventory', icon: 'warehouse', roles: ['ADMIN', 'OWNER', 'SELLER', 'VIEWER'] },
  { label: 'Clientes', path: '/customers', icon: 'people', roles: ['OWNER', 'SELLER'] },
  { label: 'Ventas', path: '/sales', icon: 'point_of_sale', roles: ['OWNER', 'SELLER'] },
  { label: 'Reportes', path: '/reports', icon: 'summarize', roles: ['ADMIN', 'OWNER', 'VIEWER'] },
  { label: 'Alertas', path: '/alerts', icon: 'notifications_active', roles: ['ADMIN', 'OWNER'] },
  { label: 'Asistente IA', path: '/assistant', icon: 'smart_toy', roles: ['OWNER', 'SELLER'] },
  { label: 'Usuarios', path: '/users', icon: 'admin_panel_settings', roles: ['ADMIN'] },
];

// IMPORTANTE: <ng-content> aparece UNA sola vez, en una ubicación fija del
// template (nunca duplicado dentro de un @if/@else). Tenerlo repetido en
// ambas ramas de una condición es lo que causaba que el contenido proyectado
// (el router-outlet y la página activa) desapareciera silenciosamente.
@Component({
  selector: 'app-nav-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      @if (auth.isAuthenticated()) {
        <mat-sidenav mode="side" opened class="sidenav">
          <div class="brand">
            <img src="assets/logo.png" alt="BizSmart" class="brand-logo" />
          </div>
          <mat-nav-list>
            @for (item of visibleItems(); track item.path) {
              <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>
      }
      <mat-sidenav-content>
        @if (auth.isAuthenticated()) {
          <mat-toolbar color="primary">
            <span class="spacer"></span>
            <span class="user-info">{{ auth.user()?.name }} · {{ auth.user()?.role }}</span>
            <button mat-icon-button (click)="logout()" title="Cerrar sesión">
              <mat-icon>logout</mat-icon>
            </button>
          </mat-toolbar>
        }
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell { height: 100vh; }
    .sidenav { width: 240px; padding-top: 8px; }
    .brand { padding: 12px 16px 4px; text-align: center; }
    .brand-logo { max-width: 140px; width: 100%; height: auto; }
    .active-link { background: rgba(63,81,181,0.08); }
    .spacer { flex: 1 1 auto; }
    .user-info { margin-right: 12px; font-size: 0.85rem; }
  `],
})
export class NavShellComponent {
  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  visibleItems(): NavItem[] {
    const role = this.auth.user()?.role;
    return NAV_ITEMS.filter((item) => role && item.roles.includes(role));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
