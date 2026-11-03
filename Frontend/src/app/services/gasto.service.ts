import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { FiltroGastos, Gasto, GastoRegistro } from '../models/gasto.model';
import type { Pagina } from '../models/pagina.model';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly api = inject(ApiService);

  /** Página de gastos ordenada por fecha descendente. */
  listar(filtro: FiltroGastos = {}): Observable<Pagina<Gasto>> {
    return this.api.get<Pagina<Gasto>>('/gastos', { ...filtro });
  }

  crear(datos: GastoRegistro): Observable<Gasto> {
    return this.api.post<Gasto>('/gastos', datos);
  }
}
