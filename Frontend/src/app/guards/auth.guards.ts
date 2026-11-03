import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../core/auth.service';

/** Pantallas privadas: sin sesión se va al login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.haySesionValida() || inject(Router).createUrlTree(['/login']);
};

/** Login y registro: con sesión se va directamente a la app. */
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.haySesionValida() || inject(Router).createUrlTree(['/gastos']);
};
