import type { MetodoPago } from './gasto.model';

export interface Vehiculo {
  id: number;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  matricula: string | null;
  anio: number | null;
  activo: boolean;
  /** Km del cuentakilómetros al darlo de alta (null en vehículos antiguos). */
  kilometrosIniciales: number | null;
}

export interface VehiculoRegistro {
  nombre: string;
  marca: string | null;
  modelo: string | null;
  matricula: string | null;
  anio: number | null;
  kilometrosIniciales: number;
}

/** Cifras del vehículo (GET /vehiculos/{id}/resumen). Consumo y costes son null sin datos suficientes. */
export interface ResumenVehiculo {
  vehiculoId: number;
  kilometrosActuales: number;
  repostajes: number;
  /** l/100 km de los tramos de lleno a lleno. */
  consumoMedio: number | null;
  costePorKilometro: number | null;
  precioMedioLitro: number | null;
  gastadoAnio: number;
  ultimoRepostajeFecha: string | null;
  ultimaItvFecha: string | null;
  ultimaItvResultado: 'FAVORABLE' | 'DESFAVORABLE' | 'NEGATIVA' | null;
  /** Estimada con las reglas de España (ver backend); null si no se puede saber. */
  proximaItvFecha: string | null;
}

export interface Repostaje {
  id: number;
  /** Fecha sin hora, p. ej. "2026-11-04". */
  fecha: string;
  litros: number;
  precioTotal: number;
  precioLitro: number;
  /** Cuentakilómetros calculado en este repostaje (iniciales + trips). */
  kilometros: number;
  /** Trip: km hechos con el depósito anterior. */
  kilometrosRecorridos: number | null;
  /** Lectura real del cuentakilómetros, si se dio para corregir la cuenta. */
  cuentakilometros: number | null;
  lleno: boolean;
  consumoOrdenador: number | null;
  velocidadMedia: number | null;
  notas: string | null;
  vehiculoId: number;
  categoriaId: number;
  categoriaNombre: string;
  metodoPago: MetodoPago;
  /** Solo en los llenos: tramo desde el lleno anterior, sumando los parciales de en medio. */
  kilometrosTramo: number | null;
  consumoReal: number | null;
  costePorKilometro: number | null;
  /** Gasto del repostaje y ticket (foto) guardado con él; null si no tiene. */
  gastoId: number | null;
  ticketId: number | null;
}

/** Hace falta el trip o la lectura del cuentakilómetros (lo normal, solo el trip). */
export interface RepostajeRegistro {
  fecha: string;
  litros: number;
  precioTotal: number;
  precioLitro: number | null;
  kilometrosRecorridos: number | null;
  cuentakilometros: number | null;
  lleno: boolean;
  consumoOrdenador: number | null;
  velocidadMedia: number | null;
  notas: string | null;
  categoriaId: number;
  metodoPago: MetodoPago;
}

export const RESULTADOS_ITV: Record<NonNullable<ResumenVehiculo['ultimaItvResultado']>, string> = {
  FAVORABLE: 'Favorable',
  DESFAVORABLE: 'Desfavorable',
  NEGATIVA: 'Negativa',
};

// ---------- Otros registros: aceite, neumáticos, mantenimiento e ITV ----------

/** Los cuatro tipos de registro que comparten la hoja de RegistroVehiculoFormComponent. */
export type TipoRegistro = 'aceite' | 'neumatico' | 'mantenimiento' | 'itv';

export type PosicionNeumaticos =
  | 'DELANTEROS'
  | 'TRASEROS'
  | 'TODOS'
  | 'DELANTERO_IZQUIERDO'
  | 'DELANTERO_DERECHO'
  | 'TRASERO_IZQUIERDO'
  | 'TRASERO_DERECHO';

export const POSICIONES_NEUMATICOS: Record<PosicionNeumaticos, string> = {
  DELANTEROS: 'Delanteros',
  TRASEROS: 'Traseros',
  TODOS: 'Los cuatro',
  DELANTERO_IZQUIERDO: 'Delantero izq.',
  DELANTERO_DERECHO: 'Delantero der.',
  TRASERO_IZQUIERDO: 'Trasero izq.',
  TRASERO_DERECHO: 'Trasero der.',
};

export type TipoMantenimiento = 'MANTENIMIENTO' | 'AVERIA_REPARACION';

export const TIPOS_MANTENIMIENTO: Record<TipoMantenimiento, string> = {
  MANTENIMIENTO: 'Mantenimiento',
  AVERIA_REPARACION: 'Avería o reparación',
};

export type ResultadoItv = NonNullable<ResumenVehiculo['ultimaItvResultado']>;

/** Campos comunes de los cuatro registros (cada uno crea y mantiene su gasto). */
export interface RegistroBase {
  id: number;
  /** Fecha sin hora, p. ej. "2026-11-04". */
  fecha: string;
  kilometros: number;
  precio: number;
  notas: string | null;
  vehiculoId: number;
  categoriaId: number;
  categoriaNombre: string;
  metodoPago: MetodoPago;
  /** Gasto del registro y ticket (foto) guardado con él; null si no tiene. */
  gastoId: number | null;
  ticketId: number | null;
}

export type Aceite = RegistroBase;

export interface Neumatico extends RegistroBase {
  posicion: PosicionNeumaticos;
}

export interface Mantenimiento extends RegistroBase {
  tipo: TipoMantenimiento;
  titulo: string;
  descripcion: string | null;
}

export interface Itv extends RegistroBase {
  resultado: ResultadoItv;
}

/** Cuerpo de alta y edición: lo común más los campos propios del tipo que correspondan. */
export interface RegistroVehiculoDatos {
  fecha: string;
  kilometros: number;
  precio: number;
  notas: string | null;
  categoriaId: number;
  metodoPago: MetodoPago;
  posicion?: PosicionNeumaticos;
  tipo?: TipoMantenimiento;
  titulo?: string;
  descripcion?: string | null;
  resultado?: ResultadoItv;
}

/** Cualquiera de los cuatro, con su tipo para distinguirlos en el historial del vehículo. */
export type RegistroVehiculo =
  | ({ tipoRegistro: 'aceite' } & Aceite)
  | ({ tipoRegistro: 'neumatico' } & Neumatico)
  | ({ tipoRegistro: 'mantenimiento' } & Mantenimiento)
  | ({ tipoRegistro: 'itv' } & Itv);
