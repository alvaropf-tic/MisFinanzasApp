import { Injectable, inject, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { Gasto, GastoRegistro } from '../models/gasto.model';
import type { LecturaTicket } from '../models/ticket.model';

/**
 * Tickets de compra: la IA lee la foto para rellenar el gasto y, al guardarlo, el ticket con su foto queda
 * dentro del gasto (se borra con él).
 */
@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly api = inject(ApiService);

  /** Sube al guardar un gasto con ticket, para que las pantallas con gastos se recarguen. */
  readonly cambios = signal(0);

  /** Lee la foto con la IA (no guarda nada). 503 si no está configurada, 429 si se agotó el límite gratuito. */
  leer(foto: Blob): Observable<LecturaTicket> {
    const formulario = new FormData();
    formulario.append('imagen', foto, 'ticket.jpg');
    return this.api.post<LecturaTicket>('/tickets/leer', formulario);
  }

  /** Guarda el gasto revisado con su ticket y la foto, todo de una vez. */
  crearGasto(datos: GastoRegistro & { comercio: string | null }, foto: Blob): Observable<Gasto> {
    const formulario = new FormData();
    formulario.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    formulario.append('imagen', foto, 'ticket.jpg');
    return this.api.post<Gasto>('/tickets/gasto', formulario).pipe(tap(() => this.cambios.update((n) => n + 1)));
  }

  /** Guarda la foto dentro de un gasto ya creado (el de un registro de vehículo escaneado). */
  adjuntar(gastoId: number, foto: Blob, comercio: string | null): Observable<Gasto> {
    const formulario = new FormData();
    formulario.append('imagen', foto, 'ticket.jpg');
    if (comercio) {
      formulario.append('comercio', comercio);
    }
    return this.api
      .post<Gasto>(`/tickets/gasto/${gastoId}`, formulario)
      .pipe(tap(() => this.cambios.update((n) => n + 1)));
  }

  /** Foto del ticket de un gasto (con el token, como cualquier otra petición). */
  imagen(ticketId: number): Observable<Blob> {
    return this.api.getBlob(`/tickets/${ticketId}/imagen`);
  }
}
