import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/view/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/view/register.component').then((m) => m.RegisterComponent),
  },
  {
    // HU02: aquí regresa el navegador después de autenticarse con Google.
    path: 'oauth-callback',
    loadComponent: () =>
      import('./features/auth/view/oauth-callback.component').then((m) => m.OAuthCallbackComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () => import('./features/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'customers',
    canActivate: [authGuard, roleGuard('OWNER', 'SELLER')],
    loadComponent: () => import('./features/customers/customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: 'sales',
    canActivate: [authGuard, roleGuard('OWNER', 'SELLER')],
    loadComponent: () => import('./features/sales/sales.component').then((m) => m.SalesComponent),
  },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard('ADMIN', 'OWNER', 'VIEWER')],
    loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'alerts',
    canActivate: [authGuard, roleGuard('ADMIN', 'OWNER')],
    loadComponent: () => import('./features/alerts/alerts.component').then((m) => m.AlertsComponent),
  },
  {
    path: 'assistant',
    canActivate: [authGuard, roleGuard('OWNER', 'SELLER')],
    loadComponent: () => import('./features/assistant/assistant.component').then((m) => m.AssistantComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
  },

  { path: '**', redirectTo: 'dashboard' },
];
