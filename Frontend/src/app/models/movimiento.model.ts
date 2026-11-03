import type { Gasto, MetodoPago } from './gasto.model';
import type { Ingreso, MetodoIngreso } from './ingreso.model';

/** Los dos tipos de movimiento que se gestionan en Finanzas. */
export type TipoMovimiento = 'gasto' | 'ingreso';

export type Movimiento = Gasto | Ingreso;

export function esGasto(movimiento: Movimiento): movimiento is Gasto {
  return 'metodoPago' in movimiento;
}

/** Icono de ionicons de cada método de pago o de ingreso (deben registrarse con `addIcons`). */
export const ICONOS_METODO: Record<MetodoPago | MetodoIngreso, string> = {
  TARJETA: 'card-outline',
  EFECTIVO: 'cash-outline',
  BIZUM: 'phone-portrait-outline',
  TRANSFERENCIA: 'swap-horizontal-outline',
};
