import { HttpErrorResponse, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

import { AuthService } from './auth.service';
import { AvisoService } from './aviso.service';

/** Rutas que no llevan token y cuyo 401 no significa "sesión caducada" (login incorrecto). */
function esRutaPublica(peticion: HttpRequest<unknown>): boolean {
  const ruta = peticion.url.substring(environment.apiUrl.length);
  return peticion.method === 'POST' && (ruta === '/auth/login' || ruta === '/usuarios');
}

/**
 * Añade `Authorization: Bearer <token>` a las peticiones a la API y, ante un 401,
 * cierra la sesión y vuelve al login. Los 400 (p. ej. contraseña actual incorrecta) no cierran la sesión.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  if (!peticion.url.startsWith(environment.apiUrl) || esRutaPublica(peticion)) {
    return siguiente(peticion);
  }

  const auth = inject(AuthService);
  const avisos = inject(AvisoService);
  const token = auth.token();
  const conToken = token ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : peticion;

  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && auth.token()) {
        // Solo la primera petición fallida avisa; las demás ya encuentran la sesión cerrada
        void avisos.advertencia('Tu sesión ha caducado. Vuelve a iniciar sesión.');
        void auth.cerrarSesion();
      }
      return throwError(() => error);
    }),
  );
};
