import { Injectable, inject, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { Usuario, UsuarioRegistro } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiService);

  /** Último perfil leído de `/usuarios/me`; lo usan la cabecera (iniciales) y la pantalla de perfil. */
  readonly actual = signal<Usuario | null>(null);

  registrar(datos: UsuarioRegistro): Observable<Usuario> {
    return this.api.post<Usuario>('/usuarios', datos);
  }

  obtenerActual(): Observable<Usuario> {
    return this.api.get<Usuario>('/usuarios/me').pipe(tap((usuario) => this.actual.set(usuario)));
  }
}
