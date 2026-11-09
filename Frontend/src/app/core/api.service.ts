import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Parámetros de consulta; los valores vacíos no se envían. */
export type Parametros = Record<string, string | number | boolean | null | undefined>;

/**
 * Único punto de acceso HTTP a la API. Los servicios de cada módulo lo usan
 * con rutas relativas (p. ej. '/gastos'); las páginas nunca lo llaman directamente.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(ruta: string, parametros?: Parametros): Observable<T> {
    return this.http.get<T>(this.url(ruta), { params: this.params(parametros) });
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.url(ruta), cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown = null): Observable<T> {
    return this.http.patch<T>(this.url(ruta), cuerpo);
  }

  /** Archivo binario (p. ej. la imagen de un ticket), con el token como cualquier otra petición. */
  getBlob(ruta: string): Observable<Blob> {
    return this.http.get(this.url(ruta), { responseType: 'blob' });
  }

  delete(ruta: string): Observable<void> {
    return this.http.delete<void>(this.url(ruta));
  }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta}`;
  }

  private params(parametros?: Parametros): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }
}
