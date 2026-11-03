import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { Usuario, UsuarioRegistro } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiService);

  registrar(datos: UsuarioRegistro): Observable<Usuario> {
    return this.api.post<Usuario>('/usuarios', datos);
  }

  obtenerActual(): Observable<Usuario> {
    return this.api.get<Usuario>('/usuarios/me');
  }
}
