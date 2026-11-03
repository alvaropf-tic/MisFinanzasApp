import { HttpErrorResponse } from '@angular/common/http';

import type { ApiError } from '../models/api-error.model';

/** Texto que se muestra al usuario para un error de la API (campo `mensaje`). */
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. Comprueba tu conexión.';
    }
    const cuerpo = error.error as Partial<ApiError> | null;
    if (cuerpo && typeof cuerpo === 'object' && typeof cuerpo.mensaje === 'string') {
      return cuerpo.mensaje;
    }
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

export function esNoAutorizado(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
