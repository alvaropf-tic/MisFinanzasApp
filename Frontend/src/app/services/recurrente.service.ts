import { Injectable, inject, signal } from '@angular/core';
import { type Observable, forkJoin, map, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { MetodoPago } from '../models/gasto.model';
import type { MetodoIngreso } from '../models/ingreso.model';
import type {
  Periodicidad,
  Recurrente,
  RecurrenteDatos,
  ResumenRecurrentes,
  ResumenRecurrentesMes,
  TipoRecurrente,
} from '../models/recurrente.model';

/** Campos comunes de las dos respuestas del backend. */
interface RecurrenteBase {
  id: number;
  importe: number;
  descripcion: string;
  periodicidad: Periodicidad;
  proximaFecha: string;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
}

interface GastoRecurrenteApi extends RecurrenteBase {
  metodoPago: MetodoPago;
  categoriaId: number;
  categoriaNombre: string;
}

interface IngresoRecurrenteApi extends RecurrenteBase {
  metodoIngreso: MetodoIngreso;
  categoriaIngresoId: number;
  categoriaIngresoNombre: string;
}

const RUTA: Record<TipoRecurrente, string> = {
  gasto: '/gastos-recurrentes',
  ingreso: '/ingresos-recurrentes',
};

function desdeGasto({ metodoPago, ...resto }: GastoRecurrenteApi): Recurrente {
  return { ...resto, tipo: 'gasto', metodo: metodoPago };
}

function desdeIngreso({
  metodoIngreso,
  categoriaIngresoId,
  categoriaIngresoNombre,
  ...resto
}: IngresoRecurrenteApi): Recurrente {
  return {
    ...resto,
    tipo: 'ingreso',
    metodo: metodoIngreso,
    categoriaId: categoriaIngresoId,
    categoriaNombre: categoriaIngresoNombre,
  };
}

/**
 * Pagos recurrentes (suscripciones, alquiler…) y cobros recurrentes (nómina…): el backend genera sus gastos
 * o ingresos cuando llega cada fecha. Aquí los dos se tratan igual, distinguidos por `tipo`.
 */
@Injectable({ providedIn: 'root' })
export class RecurrenteService {
  private readonly api = inject(ApiService);

  /**
   * Sube cada vez que se crea, cambia o borra un recurrente. Las pantallas que muestran recurrentes
   * o sus movimientos (Inicio, Finanzas, Calendario, Recurrentes) lo observan para recargarse.
   */
  readonly cambios = signal(0);

  /** Todos, pagos y cobros. */
  listar(): Observable<Recurrente[]> {
    return forkJoin([
      this.api.get<GastoRecurrenteApi[]>(RUTA.gasto),
      this.api.get<IngresoRecurrenteApi[]>(RUTA.ingreso),
    ]).pipe(map(([gastos, ingresos]) => [...gastos.map(desdeGasto), ...ingresos.map(desdeIngreso)]));
  }

  /** Activos, cobrado, pendiente y próximo de pagos y de cobros en un mes (1-12). */
  resumen(anio: number, mes: number): Observable<ResumenRecurrentesMes> {
    return forkJoin({
      pagos: this.api.get<ResumenRecurrentes>(`${RUTA.gasto}/resumen/${anio}/${mes}`),
      cobros: this.api.get<ResumenRecurrentes>(`${RUTA.ingreso}/resumen/${anio}/${mes}`),
    });
  }

  crear(tipo: TipoRecurrente, datos: RecurrenteDatos): Observable<unknown> {
    return this.api.post(RUTA[tipo], this.cuerpo(tipo, datos)).pipe(tap(() => this.avisarCambio()));
  }

  actualizar(recurrente: Recurrente, datos: RecurrenteDatos): Observable<unknown> {
    return this.api
      .put(`${RUTA[recurrente.tipo]}/${recurrente.id}`, this.cuerpo(recurrente.tipo, datos))
      .pipe(tap(() => this.avisarCambio()));
  }

  /** Alterna activo / pausado. Al reactivar, el backend no cobra los periodos pausados. */
  cambiarEstado(recurrente: Recurrente): Observable<unknown> {
    return this.api.patch(`${RUTA[recurrente.tipo]}/${recurrente.id}/estado`).pipe(tap(() => this.avisarCambio()));
  }

  /** Los movimientos que ya generó se conservan en el historial. */
  eliminar(recurrente: Recurrente): Observable<void> {
    return this.api.delete(`${RUTA[recurrente.tipo]}/${recurrente.id}`).pipe(tap(() => this.avisarCambio()));
  }

  /** Cuerpo que espera cada endpoint (GastoRecurrenteRegistroDTO o IngresoRecurrenteRegistroDTO). */
  private cuerpo(tipo: TipoRecurrente, { metodo, categoriaId, ...resto }: RecurrenteDatos): object {
    return tipo === 'gasto'
      ? { ...resto, metodoPago: metodo, categoriaId }
      : { ...resto, metodoIngreso: metodo, categoriaIngresoId: categoriaId };
  }

  private avisarCambio(): void {
    this.cambios.update((n) => n + 1);
  }
}
