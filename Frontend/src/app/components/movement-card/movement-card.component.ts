import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { IonIcon, IonItem, IonLabel, IonNote } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, carOutline, cashOutline, phonePortraitOutline, receiptOutline } from 'ionicons/icons';

import { METODOS_PAGO, type Gasto, type MetodoPago } from '../../models/gasto.model';

const ICONO_METODO: Record<MetodoPago, string> = {
  TARJETA: 'card-outline',
  EFECTIVO: 'cash-outline',
  BIZUM: 'phone-portrait-outline',
};

/** Fila de un movimiento: descripción, categoría, fecha, método de pago e importe. */
@Component({
  selector: 'app-movement-card',
  templateUrl: 'movement-card.component.html',
  styleUrls: ['movement-card.component.scss'],
  imports: [CurrencyPipe, DatePipe, IonItem, IonIcon, IonLabel, IonNote],
})
export class MovementCardComponent {
  readonly gasto = input.required<Gasto>();

  readonly icono = computed(() => ICONO_METODO[this.gasto().metodoPago]);
  readonly metodo = computed(
    () => METODOS_PAGO.find((m) => m.valor === this.gasto().metodoPago)?.etiqueta ?? this.gasto().metodoPago,
  );
  /** Los gastos creados por vehículos o tickets se marcan para distinguirlos de los manuales. */
  readonly iconoOrigen = computed(() => {
    const origen = this.gasto().origen;
    if (origen === 'MANUAL') {
      return null;
    }
    return origen === 'TICKET' ? 'receipt-outline' : 'car-outline';
  });

  constructor() {
    addIcons({ cardOutline, cashOutline, phonePortraitOutline, receiptOutline, carOutline });
  }
}
