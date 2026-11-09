import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { TotalMensual, TotalPorCategoria, TotalPorMetodoPago } from '../models/estadistica.model';

/** Estadísticas de un mes (mes 1-12) y evolución entre dos meses. */
@Injectable({ providedIn: 'root' })
export class EstadisticaService {
  private readonly api = inject(ApiService);

  gastosPorCategoria(anio: number, mes: number): Observable<TotalPorCategoria[]> {
    return this.api.get<TotalPorCategoria[]>(`/estadisticas/gastos-por-categoria/${anio}/${mes}`);
  }

  ingresosPorCategoria(anio: number, mes: number): Observable<TotalPorCategoria[]> {
    return this.api.get<TotalPorCategoria[]>(`/estadisticas/ingresos-por-categoria/${anio}/${mes}`);
  }

  gastosPorMetodoPago(anio: number, mes: number): Observable<TotalPorMetodoPago[]> {
    return this.api.get<TotalPorMetodoPago[]>(`/estadisticas/gastos-por-metodo-pago/${anio}/${mes}`);
  }

  /** Un elemento por mes del rango, ambos incluidos. */
  evolucionGastos(
    desde: { anio: number; mes: number },
    hasta: { anio: number; mes: number },
  ): Observable<TotalMensual[]> {
    return this.api.get<TotalMensual[]>(
      `/estadisticas/evolucion-gastos/${desde.anio}/${desde.mes}/${hasta.anio}/${hasta.mes}`,
    );
  }
}
