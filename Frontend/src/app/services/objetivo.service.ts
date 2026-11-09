import { Injectable, inject, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { AportacionRegistro, Objetivo, ObjetivoRegistro } from '../models/objetivo.model';

/** Objetivos de ahorro y sus aportaciones (no son gastos: es dinero que se aparta). */
@Injectable({ providedIn: 'root' })
export class ObjetivoService {
  private readonly api = inject(ApiService);

  /** Sube con cada cambio, para que Inicio y las pantallas de objetivos se recarguen. */
  readonly cambios = signal(0);

  listar(): Observable<Objetivo[]> {
    return this.api.get<Objetivo[]>('/objetivos');
  }

  obtener(id: number): Observable<Objetivo> {
    return this.api.get<Objetivo>(`/objetivos/${id}`);
  }

  crear(datos: ObjetivoRegistro): Observable<Objetivo> {
    return this.api.post<Objetivo>('/objetivos', datos).pipe(tap(() => this.avisarCambio()));
  }

  actualizar(id: number, datos: ObjetivoRegistro): Observable<Objetivo> {
    return this.api.put<Objetivo>(`/objetivos/${id}`, datos).pipe(tap(() => this.avisarCambio()));
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete(`/objetivos/${id}`).pipe(tap(() => this.avisarCambio()));
  }

  /** Importe positivo para aportar y negativo para retirar. */
  aportar(id: number, datos: AportacionRegistro): Observable<Objetivo> {
    return this.api.post<Objetivo>(`/objetivos/${id}/aportaciones`, datos).pipe(tap(() => this.avisarCambio()));
  }

  eliminarAportacion(id: number, aportacionId: number): Observable<Objetivo> {
    return this.api
      .delete(`/objetivos/${id}/aportaciones/${aportacionId}`)
      .pipe(tap(() => this.avisarCambio())) as unknown as Observable<Objetivo>;
  }

  private avisarCambio(): void {
    this.cambios.update((n) => n + 1);
  }
}
