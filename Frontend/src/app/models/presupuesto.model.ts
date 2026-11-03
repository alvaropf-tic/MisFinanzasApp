export interface Presupuesto {
  id: number;
  importe: number;
  mes: number;
  anio: number;
  gastado: number;
  /** Lo gastado más los recurrentes activos que aún caen dentro del mes. */
  prevision: number;
  restante: number;
  porcentajeGastado: number;
  porcentajePrevision: number;
}

export interface PresupuestoRegistro {
  importe: number;
  mes: number;
  anio: number;
}
