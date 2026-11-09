import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

/** Una parte del total: nombre e importe. */
export interface ParteDelTotal {
  etiqueta: string;
  valor: number;
}

/** A partir de aquí las partes más pequeñas se juntan en "Otras" (la guía de visualización fija 7 como máximo). */
const MAXIMO_FILAS = 7;

/**
 * Barras horizontales ordenadas de mayor a menor, de un solo color, para ver cómo se reparte un total
 * (gastos por categoría, por método de pago…). Cada fila lleva su nombre, su importe y su porcentaje.
 */
@Component({
  selector: 'app-barras-ranking',
  templateUrl: 'barras-ranking.component.html',
  styleUrls: ['barras-ranking.component.scss'],
  imports: [CurrencyPipe],
})
export class BarrasRankingComponent {
  readonly partes = input.required<ParteDelTotal[]>();
  /** Nombre del conjunto para lectores de pantalla, p. ej. "Gastos por categoría". */
  readonly titulo = input('');

  readonly filas = computed(() => {
    const ordenadas = [...this.partes()].filter((p) => p.valor > 0).sort((a, b) => b.valor - a.valor);
    const visibles =
      ordenadas.length > MAXIMO_FILAS
        ? [
            ...ordenadas.slice(0, MAXIMO_FILAS - 1),
            {
              etiqueta: 'Otras',
              valor: ordenadas.slice(MAXIMO_FILAS - 1).reduce((total, p) => total + p.valor, 0),
            },
          ]
        : ordenadas;
    const total = visibles.reduce((suma, p) => suma + p.valor, 0);
    const maximo = Math.max(...visibles.map((p) => p.valor), 0);
    return visibles.map((p) => ({
      ...p,
      porcentaje: total > 0 ? Math.round((p.valor / total) * 100) : 0,
      // La más grande ocupa todo el ancho; las demás, en proporción a ella
      ancho: maximo > 0 ? (p.valor / maximo) * 100 : 0,
    }));
  });
}
