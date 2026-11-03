import { Injectable, inject, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { GastoRecurrente, GastoRecurrenteRegistro, ResumenRecurrentes } from '../models/gasto-recurrente.model';

/** Pagos recurrentes (suscripciones, alquiler…): el backend genera sus gastos cuando llega cada fecha. */
@Injectable({ providedIn: 'root' })
export class GastoRecurrenteService {
  private readonly api = inject(ApiService);

  /**
   * Sube cada vez que se crea, cambia o borra un recurrente. Las pantallas que muestran recurrentes
   * o sus gastos (Inicio, Finanzas, Pagos recurrentes) lo observan para recargarse.
   */
  readonly cambios = signal(0);

  listar(): Observable<GastoRecurrente[]> {
    return this.api.get<GastoRecurrente[]>('/gastos-recurrentes');
  }

  /** Activos, cobrado, pendiente y próximo cobro de un mes (1-12). */
  resumen(anio: number, mes: number): Observable<ResumenRecurrentes> {
    return this.api.get<ResumenRecurrentes>(`/gastos-recurrentes/resumen/${anio}/${mes}`);
  }

  crear(datos: GastoRecurrenteRegistro): Observable<GastoRecurrente> {
    return this.api.post<GastoRecurrente>('/gastos-recurrentes', datos).pipe(tap(() => this.avisarCambio()));
  }

  actualizar(id: number, datos: GastoRecurrenteRegistro): Observable<GastoRecurrente> {
    return this.api.put<GastoRecurrente>(`/gastos-recurrentes/${id}`, datos).pipe(tap(() => this.avisarCambio()));
  }

  /** Alterna activo / pausado. Al reactivar, el backend no cobra los periodos pausados. */
  cambiarEstado(id: number): Observable<GastoRecurrente> {
    return this.api.patch<GastoRecurrente>(`/gastos-recurrentes/${id}/estado`).pipe(tap(() => this.avisarCambio()));
  }

  /** Los gastos que ya generó se conservan en el historial. */
  eliminar(id: number): Observable<void> {
    return this.api.delete(`/gastos-recurrentes/${id}`).pipe(tap(() => this.avisarCambio()));
  }

  private avisarCambio(): void {
    this.cambios.update((n) => n + 1);
  }
}
