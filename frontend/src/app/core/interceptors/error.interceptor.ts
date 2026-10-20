import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

// Manejo consistente de errores HTTP (401/403/resto) - punto 21 de la especificación.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        router.navigate(['/login']);
        snackBar.open('Tu sesión expiró. Inicia sesión nuevamente.', 'Cerrar', { duration: 4000 });
      } else if (error.status === 403) {
        snackBar.open('No tienes permisos para esta acción.', 'Cerrar', { duration: 4000 });
      } else {
        const message = error.error?.message ?? 'Ocurrió un error inesperado.';
        snackBar.open(Array.isArray(message) ? message[0] : message, 'Cerrar', { duration: 4000 });
      }
      return throwError(() => error);
    }),
  );
};
