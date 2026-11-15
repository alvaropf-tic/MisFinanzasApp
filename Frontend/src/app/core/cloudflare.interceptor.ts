import type { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';

/**
 * App Android: las peticiones a la API por Cloudflare llevan el service token de Cloudflare Access
 * (`CF-Access-Client-Id` y `CF-Access-Client-Secret`); sin él, Cloudflare las manda a su pantalla de login.
 * Va también en las rutas públicas (login, registro), que igualmente pasan por Cloudflare.
 */
export const cloudflareInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const acceso = environment.accesoCloudflare;
  if (!acceso || !peticion.url.startsWith(acceso.url)) {
    return siguiente(peticion);
  }
  return siguiente(
    peticion.clone({
      setHeaders: { 'CF-Access-Client-Id': acceso.clientId, 'CF-Access-Client-Secret': acceso.clientSecret },
    }),
  );
};
