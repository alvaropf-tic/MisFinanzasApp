import { Injectable, inject, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { CambioPassword, Usuario, UsuarioActualizar, UsuarioRegistro } from '../models/usuario.model';

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

  /** 409 si el correo ya lo usa otra cuenta. Actualiza también `actual` (iniciales de la cabecera). */
  actualizar(datos: UsuarioActualizar): Observable<Usuario> {
    return this.api.put<Usuario>('/usuarios/me', datos).pipe(tap((usuario) => this.actual.set(usuario)));
  }

  /** 400 si la actual no es correcta o la nueva es igual. La sesión sigue abierta después. */
  cambiarPassword(datos: CambioPassword): Observable<void> {
    return this.api.put<void>('/usuarios/me/password', datos);
  }

  /** Borra la cuenta y todos sus datos. 400 si la contraseña no es correcta. */
  eliminarCuenta(password: string): Observable<void> {
    return this.api.post<void>('/usuarios/me/eliminar', { password });
  }
}
