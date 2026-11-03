export type MetodoIngreso = 'TRANSFERENCIA' | 'EFECTIVO' | 'BIZUM';

export const METODOS_INGRESO: { valor: MetodoIngreso; etiqueta: string }[] = [
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'BIZUM', etiqueta: 'Bizum' },
];

export interface Ingreso {
  id: number;
  importe: number;
  /** Fecha con hora, p. ej. "2026-11-01T09:00:00". */
  fecha: string;
  descripcion: string | null;
  metodoIngreso: MetodoIngreso;
  categoriaIngresoId: number;
  categoriaIngresoNombre: string;
}

export interface IngresoRegistro {
  importe: number;
  fecha: string;
  descripcion: string | null;
  metodoIngreso: MetodoIngreso;
  categoriaIngresoId: number;
}

/** Filtros opcionales de GET /api/ingresos. */
export interface FiltroIngresos {
  desde?: string;
  hasta?: string;
  categoriaIngresoId?: number;
  metodoIngreso?: MetodoIngreso;
  texto?: string;
  page?: number;
  size?: number;
}
