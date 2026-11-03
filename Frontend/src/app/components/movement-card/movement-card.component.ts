import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { IonIcon, IonItem, IonLabel, IonNote } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cardOutline,
  carOutline,
  cashOutline,
  phonePortraitOutline,
  receiptOutline,
  repeatOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import { METODOS_PAGO } from '../../models/gasto.model';
import { METODOS_INGRESO } from '../../models/ingreso.model';
import { ICONOS_METODO, type Movimiento, esGasto } from '../../models/movimiento.model';

/** Fila de un gasto o un ingreso: descripción, categoría, fecha, método e importe (− gasto, + ingreso). */
@Component({
  selector: 'app-movement-card',
  templateUrl: 'movement-card.component.html',
  styleUrls: ['movement-card.component.scss'],
  imports: [CurrencyPipe, DatePipe, IonItem, IonIcon, IonLabel, IonNote],
})
export class MovementCardComponent {
  readonly movimiento = input.required<Movimiento>();

  readonly esIngreso = computed(() => !esGasto(this.movimiento()));
  readonly categoria = computed(() => {
    const m = this.movimiento();
    return esGasto(m) ? m.categoriaNombre : m.categoriaIngresoNombre;
  });
  private readonly metodoValor = computed(() => {
    const m = this.movimiento();
    return esGasto(m) ? m.metodoPago : m.metodoIngreso;
  });
  readonly icono = computed(() => ICONOS_METODO[this.metodoValor()]);
  readonly metodo = computed(
    () =>
      [...METODOS_PAGO, ...METODOS_INGRESO].find((m) => m.valor === this.metodoValor())?.etiqueta ?? this.metodoValor(),
  );
  /** Los gastos que no se apuntaron a mano llevan un icono de su origen junto al importe. */
  readonly origen = computed(() => {
    const m = this.movimiento();
    if (!esGasto(m) || m.origen === 'MANUAL') {
      return null;
    }
    if (m.origen === 'RECURRENTE') {
      return { icono: 'repeat-outline', etiqueta: 'Pago recurrente' };
    }
    if (m.origen === 'TICKET') {
      return { icono: 'receipt-outline', etiqueta: 'Desde un ticket' };
    }
    return { icono: 'car-outline', etiqueta: 'Gasto de vehículo' };
  });

  constructor() {
    addIcons({
      cardOutline,
      cashOutline,
      phonePortraitOutline,
      swapHorizontalOutline,
      receiptOutline,
      repeatOutline,
      carOutline,
    });
  }
}
