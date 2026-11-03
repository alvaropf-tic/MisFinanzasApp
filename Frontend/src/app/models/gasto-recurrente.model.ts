import type { MetodoPago } from './gasto.model';

export type Periodicidad = 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const PERIODICIDADES: Record<Periodicidad, string> = {
  SEMANAL: 'Semanal',
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

/** Veces al mes que se cobra cada periodicidad, para estimar el coste mensual. */
export const COBROS_AL_MES: Record<Periodicidad, number> = {
  SEMANAL: 52 / 12,
  MENSUAL: 1,
  TRIMESTRAL: 1 / 3,
  SEMESTRAL: 1 / 6,
  ANUAL: 1 / 12,
};

export interface GastoRecurrente {
  id: number;
  importe: number;
  /** Nombre del pago (p. ej. "Netflix"); obligatorio en el backend. */
  descripcion: string;
  metodoPago: MetodoPago;
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
 * Alta y edición. Si `proximaFecha` es hoy o anterior, el backend genera el gasto al momento.
 * `fechaInicio` marca el día de referencia de los cobros mensuales (el 31 pasa al 30 en meses cortos).
 */
export interface GastoRecurrenteRegistro {
  importe: number;
  descripcion: string;
  metodoPago: MetodoPago;
  periodicidad: Periodicidad;
  proximaFecha: string;
  fechaInicio: string;
  fechaFin: string | null;
  categoriaId: number;
}

/** Resumen del mes para la sección de Finanzas (GET /gastos-recurrentes/resumen/{anio}/{mes}). */
export interface ResumenRecurrentes {
  activos: number;
  /** Gastos ya generados por recurrentes en el mes. */
  cobrado: number;
  /** Lo que aún falta por cobrar en el mes. */
  pendiente: number;
  total: number;
  proximoDescripcion: string | null;
  proximaFecha: string | null;
  proximoImporte: number | null;
}
