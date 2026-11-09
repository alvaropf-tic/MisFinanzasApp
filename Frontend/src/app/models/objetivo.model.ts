export interface Aportacion {
  id: number;
  /** Positivo = aportación; negativo = retirada. */
  importe: number;
  /** Fecha sin hora, p. ej. "2026-11-09". */
  fecha: string;
  nota: string | null;
}

export interface Objetivo {
  id: number;
  nombre: string;
  importeObjetivo: number;
  fechaLimite: string | null;
  icono: string | null;
  creadoEn: string;
  ahorrado: number;
  /** Lo que falta (0 si ya se alcanzó). */
  restante: number;
  /** 0-100 (puede pasar de 100). */
  porcentaje: number;
  completado: boolean;
  /** Con fecha límite y sin completar: lo que habría que apartar cada mes, contando el actual. */
  ahorroMensualNecesario: number | null;
  /** Meses que quedan hasta la fecha límite contando el actual (0 si ya pasó); null sin fecha. */
  mesesRestantes: number | null;
  /** De la más reciente a la más antigua. */
  aportaciones: Aportacion[];
}

export interface ObjetivoRegistro {
  nombre: string;
  importeObjetivo: number;
  fechaLimite: string | null;
  icono: string | null;
}

export interface AportacionRegistro {
  importe: number;
  fecha: string;
  nota: string | null;
}

/** Iconos para elegir al crear un objetivo (el primero es el de por defecto). */
export const ICONOS_OBJETIVO: { icono: string; nombre: string }[] = [
  { icono: 'wallet-outline', nombre: 'Ahorro' },
  { icono: 'airplane-outline', nombre: 'Viaje' },
  { icono: 'home-outline', nombre: 'Casa' },
  { icono: 'car-sport-outline', nombre: 'Coche' },
  { icono: 'school-outline', nombre: 'Estudios' },
  { icono: 'gift-outline', nombre: 'Regalo' },
  { icono: 'medkit-outline', nombre: 'Emergencias' },
  { icono: 'phone-portrait-outline', nombre: 'Tecnología' },
];
