import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  airplaneOutline,
  carSportOutline,
  checkmarkCircle,
  giftOutline,
  homeOutline,
  medkitOutline,
  phonePortraitOutline,
  schoolOutline,
  walletOutline,
} from 'ionicons/icons';

import { monedaActual } from '../../core/moneda';
import type { Objetivo } from '../../models/objetivo.model';

/** Un objetivo de ahorro: icono, nombre, ahorrado de la meta, barra de progreso y el ritmo necesario. */
@Component({
  selector: 'app-fila-objetivo',
  templateUrl: 'fila-objetivo.component.html',
  styleUrls: ['fila-objetivo.component.scss'],
  imports: [CurrencyPipe, IonIcon],
  host: { '[class.completado]': 'objetivo().completado' },
})
export class FilaObjetivoComponent {
  readonly objetivo = input.required<Objetivo>();

  /** Ancho de la barra (0-100). */
  readonly ancho = computed(() => Math.min(100, Math.max(0, this.objetivo().porcentaje)));

  /** "¡Conseguido!", "45 € al mes durante 3 meses", "Sin fecha límite"… */
  readonly detalle = computed(() => {
    const o = this.objetivo();
    if (o.completado) {
      return '¡Conseguido!';
    }
    if (o.fechaLimite === null) {
      return 'Sin fecha límite';
    }
    if (o.mesesRestantes === 0 || o.ahorroMensualNecesario === null) {
      return 'La fecha límite ya ha pasado';
    }
    const importe = o.ahorroMensualNecesario.toLocaleString('es-ES', { style: 'currency', currency: monedaActual() });
    return o.mesesRestantes === 1
      ? `Faltan ${importe} este mes`
      : `${importe} al mes durante ${o.mesesRestantes} meses`;
  });

  constructor() {
    addIcons({
      airplaneOutline,
      carSportOutline,
      checkmarkCircle,
      giftOutline,
      homeOutline,
      medkitOutline,
      phonePortraitOutline,
      schoolOutline,
      walletOutline,
    });
  }
}
