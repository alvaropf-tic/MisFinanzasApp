export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'BIZUM';

export type OrigenGasto =
  'MANUAL' | 'REPOSTAJE' | 'ACEITE' | 'NEUMATICO' | 'MANTENIMIENTO' | 'ITV' | 'TICKET' | 'RECURRENTE';

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'TARJETA', etiqueta: 'Tarjeta' },
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'BIZUM', etiqueta: 'Bizum' },
];

export interface Gasto {
  id: number;
  importe: number;
  /** Fecha con hora, p. ej. "2026-11-03T13:45:00". */
  fecha: string;
  descripcion: string | null;
  metodoPago: MetodoPago;
  categoriaId: number;
  categoriaNombre: string;
  origen: OrigenGasto;
  /** Ticket guardado con el gasto (su foto); null si no tiene. */
  ticketId: number | null;
  /** Gastos de vehículo: vehículo y registro (repostaje, ITV…) que lo crearon. */
  vehiculoId: number | null;
  registroId: number | null;
}

export interface GastoRegistro {
  importe: number;
  fecha: string;
  descripcion: string | null;
  metodoPago: MetodoPago;
  categoriaId: number;
}

/** Filtros opcionales de GET /api/gastos. */
export interface FiltroGastos {
  desde?: string;
  hasta?: string;
  categoriaId?: number;
  metodoPago?: MetodoPago;
  texto?: string;
  page?: number;
  size?: number;
}
