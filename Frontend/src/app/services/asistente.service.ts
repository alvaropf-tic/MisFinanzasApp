import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../core/api.service';
import { mensajeDeError } from '../core/mensaje-error';
import { monedaActual } from '../core/moneda';

export interface MensajeChat {
  rol: 'user' | 'assistant';
  texto: string;
  /** Respuesta fallida: se muestra como aviso y no se manda como historial. */
  error?: boolean;
}

/**
 * Chat con la IA sobre tus finanzas. La conversación vive solo en memoria (se mantiene al cambiar de pestaña
 * y se pierde al cerrar la app): el backend recibe los últimos mensajes y un resumen de tus datos.
 */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly api = inject(ApiService);

  readonly mensajes = signal<MensajeChat[]>([]);
  readonly pensando = signal(false);

  async preguntar(pregunta: string): Promise<void> {
    const texto = pregunta.trim();
    if (!texto || this.pensando()) {
      return;
    }
    const historial = this.mensajes()
      .filter((m) => !m.error)
      .slice(-6)
      .map(({ rol, texto }) => ({ rol, texto }));

    this.mensajes.update((m) => [...m, { rol: 'user', texto }]);
    this.pensando.set(true);
    try {
      const { respuesta } = await firstValueFrom(
        this.api.post<{ respuesta: string }>('/ia/chat', { pregunta: texto, historial, moneda: monedaActual() }),
      );
      this.mensajes.update((m) => [...m, { rol: 'assistant', texto: respuesta }]);
    } catch (error) {
      this.mensajes.update((m) => [...m, { rol: 'assistant', texto: mensajeDeError(error), error: true }]);
    } finally {
      this.pensando.set(false);
    }
  }

  reiniciar(): void {
    this.mensajes.set([]);
  }
}
