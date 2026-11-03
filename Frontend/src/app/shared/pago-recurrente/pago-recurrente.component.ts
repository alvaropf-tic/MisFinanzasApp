import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { type GastoRecurrente, PERIODICIDADES } from '../../models/gasto-recurrente.model';

/** Fila de un pago recurrente: fecha del próximo cobro, nombre, categoría · periodicidad e importe. */
@Component({
  selector: 'app-pago-recurrente',
  templateUrl: 'pago-recurrente.component.html',
  styleUrls: ['pago-recurrente.component.scss'],
  imports: [CurrencyPipe],
  host: { '[class.pausado]': '!recurrente().activo' },
})
export class PagoRecurrenteComponent {
  readonly recurrente = input.required<GastoRecurrente>();
  readonly periodicidades = PERIODICIDADES;

  /** Día y mes abreviado del próximo cobro. La fecha llega sin hora ("2026-11-15"): se lee como local. */
  readonly fecha = computed(() => {
    const [anio, mes, dia] = this.recurrente().proximaFecha.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return { dia, mes: fecha.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') };
  });
}
