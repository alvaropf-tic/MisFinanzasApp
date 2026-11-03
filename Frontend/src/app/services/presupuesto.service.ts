import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, of, throwError } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { Presupuesto, PresupuestoRegistro } from '../models/presupuesto.model';

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly api = inject(ApiService);

  /** Presupuesto de un mes, o `null` si ese mes no tiene (el backend responde 404). */
  obtener(anio: number, mes: number): Observable<Presupuesto | null> {
    return this.api
      .get<Presupuesto>('/presupuestos', { mes, anio })
      .pipe(
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error),
        ),
      );
  }

  crear(datos: PresupuestoRegistro): Observable<Presupuesto> {
    return this.api.post<Presupuesto>('/presupuestos', datos);
  }

  actualizar(id: number, datos: PresupuestoRegistro): Observable<Presupuesto> {
    return this.api.put<Presupuesto>(`/presupuestos/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete(`/presupuestos/${id}`);
  }
}
