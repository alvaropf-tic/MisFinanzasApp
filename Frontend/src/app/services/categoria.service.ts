import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { Categoria, CategoriaRegistro } from '../models/categoria.model';

/** Categorías de gasto. */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly api = inject(ApiService);

  listar(): Observable<Categoria[]> {
    return this.api.get<Categoria[]>('/categorias');
  }

  crear(datos: CategoriaRegistro): Observable<Categoria> {
    return this.api.post<Categoria>('/categorias', datos);
  }
}
