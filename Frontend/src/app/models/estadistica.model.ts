import type { MetodoPago } from './gasto.model';

/** Total de un mes por categoría (gastos o ingresos), de mayor a menor. */
export interface TotalPorCategoria {
  categoriaId: number;
  categoriaNombre: string;
  total: number;
}

export interface TotalPorMetodoPago {
  metodoPago: MetodoPago;
  total: number;
}

/** Gasto de un mes (mes 1-12), un elemento por mes del rango aunque sea 0. */
export interface TotalMensual {
  mes: number;
  anio: number;
  total: number;
}
