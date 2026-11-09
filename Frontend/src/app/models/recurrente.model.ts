import type { MetodoPago } from './gasto.model';
import type { MetodoIngreso } from './ingreso.model';

export type Periodicidad = 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const PERIODICIDADES: Record<Periodicidad, string> = {
  SEMANAL: 'Semanal',
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

/** Veces al mes que se cobra cada periodicidad, para estimar el importe mensual. */
export const COBROS_AL_MES: Record<Periodicidad, number> = {
  SEMANAL: 52 / 12,
  MENSUAL: 1,
  TRIMESTRAL: 1 / 3,
  SEMESTRAL: 1 / 6,
  ANUAL: 1 / 12,
};

/** Pago recurrente (genera gastos: suscripciones, alquiler…) o cobro recurrente (genera ingresos: nómina…). */
export type TipoRecurrente = 'gasto' | 'ingreso';

/**
 * Recurrente tal como lo usan las pantallas: los de gastos y los de ingresos con los mismos campos
 * (el backend los llama `metodoPago`/`categoriaId` y `metodoIngreso`/`categoriaIngresoId`).
 */
export interface Recurrente {
  tipo: TipoRecurrente;
  id: number;
  importe: number;
  /** Nombre (p. ej. "Netflix", "Nómina"); obligatorio en el backend. */
  descripcion: string;
  metodo: MetodoPago | MetodoIngreso;
  periodicidad: Periodicidad;
  /** Fechas sin hora, p. ej. "2026-11-15". */
  proximaFecha: string;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  categoriaId: number;
  categoriaNombre: string;
}

/**
 * Alta y edición. Si `proximaFecha` es hoy o anterior, el backend genera el movimiento al momento.
 * `fechaInicio` marca el día de referencia de los cobros mensuales (el 31 pasa al 30 en meses cortos).
 */
export interface RecurrenteDatos {
  importe: number;
  descripcion: string;
  metodo: MetodoPago | MetodoIngreso;
  periodicidad: Periodicidad;
  proximaFecha: string;
  fechaInicio: string;
  fechaFin: string | null;
  categoriaId: number;
}

/** Resumen de un mes (GET /gastos-recurrentes/resumen y /ingresos-recurrentes/resumen). */
export interface ResumenRecurrentes {
  activos: number;
  /** Movimientos ya generados por recurrentes en el mes. */
  cobrado: number;
  /** Lo que aún falta en el mes. */
  pendiente: number;
  total: number;
  proximoDescripcion: string | null;
  proximaFecha: string | null;
  proximoImporte: number | null;
}

/** Pagos (gastos) y cobros (ingresos) recurrentes de un mes. */
export interface ResumenRecurrentesMes {
  pagos: ResumenRecurrentes;
  cobros: ResumenRecurrentes;
}
