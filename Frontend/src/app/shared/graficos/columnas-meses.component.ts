import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';

import type { TotalMensual } from '../../models/estadistica.model';

/** Clave de un mes para compararlos: "2026-11". */
export const claveMes = (anio: number, mes: number): string => `${anio}-${String(mes).padStart(2, '0')}`;

/**
 * Columnas del gasto de cada mes con énfasis: el mes elegido en el color de acento y el resto en gris.
 * Al pasar por encima (o enfocar con el teclado) se ve el importe de ese mes; al tocar uno, se elige.
 */
@Component({
  selector: 'app-columnas-meses',
  templateUrl: 'columnas-meses.component.html',
  styleUrls: ['columnas-meses.component.scss'],
  imports: [CurrencyPipe],
})
export class ColumnasMesesComponent {
  readonly meses = input.required<TotalMensual[]>();
  /** Mes resaltado, como clave "2026-11". */
  readonly seleccionado = input<string>('');
  readonly elegir = output<TotalMensual>();

  /** Mes bajo el puntero o con el foco; mientras no hay ninguno, se muestra el importe del elegido. */
  readonly encima = signal<string | null>(null);

  readonly columnas = computed(() => {
    const maximo = Math.max(...this.meses().map((m) => m.total), 0);
    return this.meses().map((m) => {
      const fecha = new Date(m.anio, m.mes - 1, 1);
      return {
        ...m,
        clave: claveMes(m.anio, m.mes),
        alto: maximo > 0 ? (m.total / maximo) * 100 : 0,
        inicial: fecha.toLocaleDateString('es-ES', { month: 'narrow' }).toUpperCase(),
        nombre: fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      };
    });
  });

  /** La columna cuyo importe se muestra: la de encima o, si no, la elegida. */
  readonly destacada = computed(() => this.encima() ?? this.seleccionado());
}
