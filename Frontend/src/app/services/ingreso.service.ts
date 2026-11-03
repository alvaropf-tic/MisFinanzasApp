import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { FiltroIngresos, Ingreso, IngresoRegistro } from '../models/ingreso.model';
import type { Pagina } from '../models/pagina.model';

@Injectable({ providedIn: 'root' })
export class IngresoService {
  private readonly api = inject(ApiService);

  /** Página de ingresos ordenada por fecha descendente. */
  listar(filtro: FiltroIngresos = {}): Observable<Pagina<Ingreso>> {
    return this.api.get<Pagina<Ingreso>>('/ingresos', { ...filtro });
  }

  crear(datos: IngresoRegistro): Observable<Ingreso> {
    return this.api.post<Ingreso>('/ingresos', datos);
  }
}
