import type { MetodoPago } from './gasto.model';

/** Compra normal o gasto de vehículo (se registra en su módulo). */
export type TipoTicket = 'COMPRA' | 'REPOSTAJE' | 'ITV' | 'ACEITE' | 'NEUMATICOS' | 'MANTENIMIENTO';

/**
 * Lo que la IA ha leído en la foto de un ticket (POST /tickets/leer). Cada campo es null si no se ha podido
 * leer: la hoja del gasto se rellena con lo que haya y el usuario revisa antes de guardar.
 */
export interface LecturaTicket {
  comercio: string | null;
  /** Fecha sin hora, p. ej. "2026-11-08". */
  fecha: string | null;
  importe: number | null;
  metodoPago: MetodoPago | null;
  /** Una de las categorías del usuario que encaja con la compra. */
  categoriaId: number | null;
  /** Sin vehículos siempre es COMPRA. */
  tipo: TipoTicket;
  /** Vehículo cuya matrícula aparece en el ticket. */
  vehiculoId: number | null;
  /** Solo en repostajes. */
  litros: number | null;
  precioLitro: number | null;
}

/** Ticket ya leído que se guarda en un registro de vehículo: la foto (reducida), lo leído y el aviso de la hoja. */
export interface TicketEscaneado {
  foto: Blob;
  lectura: LecturaTicket;
  mensaje: string;
}
