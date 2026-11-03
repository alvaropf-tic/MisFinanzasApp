/** Resumen de un mes (GET /api/resumen/{anio}/{mes}). Sin presupuesto, `presupuesto` y `restantePresupuesto` valen 0. */
export interface ResumenMensual {
  mes: number;
  anio: number;
  ingresos: number;
  gastos: number;
  presupuesto: number;
  /** Lo gastado más los recurrentes activos que aún caen dentro del mes. */
  prevision: number;
  restantePresupuesto: number;
  /** Ingresos − gastos. */
  saldo: number;
}
