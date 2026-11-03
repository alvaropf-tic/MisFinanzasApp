import { Injectable, computed, inject, signal } from '@angular/core';
import { NavController } from '@ionic/angular';
import { type Observable, from, map, switchMap } from 'rxjs';

import type { Login, LoginRespuesta } from '../models/usuario.model';

import { ApiService } from './api.service';
import { StorageService } from './storage.service';

/** Datos de la sesión guardados en el dispositivo. */
interface Sesion {
  token: string;
  id: number;
  nombreUsuario: string;
  rol: string;
  /** Caducidad del token en milisegundos (epoch). */
  expira: number;
}

const CLAVE_SESION = 'sesion';
const DURACION_TOKEN_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly navController = inject(NavController);

  private readonly sesion = signal<Sesion | null>(null);

  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly nombreUsuario = computed(() => this.sesion()?.nombreUsuario ?? null);

  /** Recupera la sesión guardada al arrancar la app; descarta la caducada. */
  async restaurar(): Promise<void> {
    const guardada = await this.storage.leer(CLAVE_SESION);
    if (!guardada) {
      return;
    }
    try {
      const sesion = JSON.parse(guardada) as Sesion;
      if (sesion.expira > Date.now()) {
        this.sesion.set(sesion);
        return;
      }
    } catch {
      // Contenido no válido: se descarta
    }
    await this.storage.borrar(CLAVE_SESION);
  }

  /** `recordar` guarda la sesión de forma persistente; si no, solo dura mientras la app está abierta. */
  login(datos: Login, recordar: boolean): Observable<LoginRespuesta> {
    return this.api
      .post<LoginRespuesta>('/auth/login', datos)
      .pipe(switchMap((respuesta) => from(this.guardarSesion(respuesta, recordar)).pipe(map(() => respuesta))));
  }

  haySesionValida(): boolean {
    const sesion = this.sesion();
    return sesion !== null && sesion.expira > Date.now();
  }

  async cerrarSesion(): Promise<void> {
    this.sesion.set(null);
    await this.storage.borrar(CLAVE_SESION);
    // navigateRoot vacía la pila de pantallas: no se puede volver atrás a la app
    await this.navController.navigateRoot('/login', { animationDirection: 'back' });
  }

  private async guardarSesion(respuesta: LoginRespuesta, recordar: boolean): Promise<void> {
    const sesion: Sesion = {
      token: respuesta.token,
      id: respuesta.id,
      nombreUsuario: respuesta.nombreUsuario,
      rol: respuesta.rol,
      expira: this.caducidad(respuesta.token),
    };
    this.sesion.set(sesion);
    await this.storage.guardar(CLAVE_SESION, JSON.stringify(sesion), recordar);
  }

  /** Lee el `exp` del JWT; si no se puede, se asumen las 24 h del backend. */
  private caducidad(token: string): number {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(payload)) as { exp?: number };
      if (typeof exp === 'number') {
        return exp * 1000;
      }
    } catch {
      // Token sin formato JWT legible
    }
    return Date.now() + DURACION_TOKEN_MS;
  }
}
