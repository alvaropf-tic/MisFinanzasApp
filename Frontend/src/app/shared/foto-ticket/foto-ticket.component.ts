import { Component, type OnDestroy, effect, inject, input, output, signal, untracked } from '@angular/core';
import { IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { receiptOutline, sparklesOutline, swapHorizontalOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { TicketService } from '../../services/ticket.service';

/**
 * Foto del ticket en una hoja de registro de vehículo: la recién escaneada (`foto`) o la guardada (`ticketId`).
 * Al tocarla se ve entera. Con `mensaje` muestra el aviso de la lectura y, con `accion`, un botón (p. ej.
 * «Guardar como gasto normal»).
 */
@Component({
  selector: 'app-foto-ticket',
  templateUrl: 'foto-ticket.component.html',
  styleUrls: ['foto-ticket.component.scss'],
  imports: [IonIcon, IonSpinner],
})
export class FotoTicketComponent implements OnDestroy {
  private readonly ticketService = inject(TicketService);

  readonly foto = input<Blob | null>(null);
  readonly ticketId = input<number | null>(null);
  readonly mensaje = input<string | null>(null);
  readonly accion = input<string | null>(null);
  readonly accionPulsada = output<void>();

  readonly url = signal<string | null>(null);
  readonly cargando = signal(false);
  readonly ampliada = signal(false);

  constructor() {
    addIcons({ receiptOutline, sparklesOutline, swapHorizontalOutline });
    effect(() => {
      const foto = this.foto();
      const ticketId = this.ticketId();
      // Sin seguir `url`: poner() la lee para liberar la anterior y la vuelve a escribir, y si el efecto
      // dependiera de ella se ejecutaría sin fin (la app se quedaba congelada)
      untracked(() => {
        if (foto) {
          this.poner(foto);
        } else if (ticketId !== null) {
          void this.cargar(ticketId);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.liberar();
  }

  private async cargar(ticketId: number): Promise<void> {
    this.cargando.set(true);
    try {
      this.poner(await firstValueFrom(this.ticketService.imagen(ticketId)));
    } catch {
      // Sin foto la hoja sigue sirviendo
    } finally {
      this.cargando.set(false);
    }
  }

  private poner(blob: Blob): void {
    this.liberar();
    this.url.set(URL.createObjectURL(blob));
  }

  private liberar(): void {
    const actual = this.url();
    if (actual) {
      URL.revokeObjectURL(actual);
    }
  }
}
