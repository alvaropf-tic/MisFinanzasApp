import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { ResumenMensual } from '../models/resumen.model';

@Injectable({ providedIn: 'root' })
export class ResumenService {
  private readonly api = inject(ApiService);

  /** Ingresos, gastos, saldo y presupuesto de un mes (1-12). */
  obtener(anio: number, mes: number): Observable<ResumenMensual> {
    return this.api.get<ResumenMensual>(`/resumen/${anio}/${mes}`);
  }
}
