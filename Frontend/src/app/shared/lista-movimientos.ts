import { signal } from '@angular/core';
import { type Observable, firstValueFrom } from 'rxjs';

import { esNoAutorizado } from '../core/mensaje-error';
import type { Movimiento } from '../models/movimiento.model';
import type { Pagina } from '../models/pagina.model';

/** Carga una página de un listado ordenado por fecha descendente (`/gastos`, `/ingresos`). */
export type PedirPagina = (pagina: number) => Observable<Pagina<Movimiento>>;

interface Fuente {
  pedir: PedirPagina;
  cargados: Movimiento[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
}

const agotada = (fuente: Fuente): boolean => fuente.pagina + 1 >= fuente.totalPaginas;
const ultimaFecha = (fuente: Fuente): string => fuente.cargados.at(-1)?.fecha ?? '';

/**
 * Lista cronológica que mezcla varios listados paginados (gastos e ingresos) con scroll infinito.
 *
 * Cada fuente se pagina por separado. Solo se muestra lo que es seguro ordenar: los movimientos
 * hasta la fecha del último elemento cargado de cada fuente que aún tiene páginas. Lo más antiguo
 * espera a que esa fuente cargue su siguiente página, así nada aparece fuera de orden al hacer scroll.
 */
export class ListaMovimientos {
  readonly elementos = signal<Movimiento[]>([]);
  readonly totalElementos = signal(0);
  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);
  readonly hayMas = signal(false);

  private fuentes: Fuente[] = [];
  /** Cada recarga invalida las respuestas pendientes de la anterior (p. ej. al cambiar de filtro). */
  private version = 0;

  constructor(private readonly alFallar: (error: unknown) => void) {}

  /** Carga la primera página de cada fuente. Con `limpiar` se vacía la lista mientras tanto (cambio de filtro). */
  async recargar(pedidores: PedirPagina[], { limpiar = false } = {}): Promise<void> {
    const version = ++this.version;
    this.errorCarga.set(false);
    if (limpiar) {
      this.elementos.set([]);
      this.cargandoInicial.set(true);
    }
    try {
      const fuentes = await Promise.all(
        pedidores.map(async (pedir) => {
          const pagina = await firstValueFrom(pedir(0));
          return {
            pedir,
            cargados: pagina.contenido,
            pagina: pagina.pagina,
            totalPaginas: pagina.totalPaginas,
            totalElementos: pagina.totalElementos,
          };
        }),
      );
      if (version !== this.version) {
        return;
      }
      this.fuentes = fuentes;
      this.actualizar();
    } catch (error) {
      if (version !== this.version) {
        return;
      }
      // Con un 401 el interceptor ya está volviendo al login: no se muestra el estado de error
      this.errorCarga.set(!esNoAutorizado(error) && this.elementos().length === 0);
      this.alFallar(error);
    } finally {
      if (version === this.version) {
        this.cargandoInicial.set(false);
      }
    }
  }

  /** Carga la siguiente página de la fuente que está limitando lo que se puede mostrar. */
  async cargarMas(): Promise<void> {
    const pendientes = this.fuentes.filter((f) => !agotada(f));
    if (pendientes.length === 0) {
      return;
    }
    const limitante = pendientes.reduce((a, b) => (ultimaFecha(a) >= ultimaFecha(b) ? a : b));
    const version = this.version;
    try {
      const pagina = await firstValueFrom(limitante.pedir(limitante.pagina + 1));
      if (version !== this.version) {
        return;
      }
      // Si se ha creado un movimiento entretanto, la página siguiente puede repetir alguno
      const ids = new Set(limitante.cargados.map((m) => m.id));
      limitante.cargados = [...limitante.cargados, ...pagina.contenido.filter((m) => !ids.has(m.id))];
      limitante.pagina = pagina.pagina;
      limitante.totalPaginas = pagina.totalPaginas;
      limitante.totalElementos = pagina.totalElementos;
      this.actualizar();
    } catch (error) {
      this.alFallar(error);
    }
  }

  private actualizar(): void {
    const pendientes = this.fuentes.filter((f) => !agotada(f));
    const corte = pendientes.map(ultimaFecha).reduce((a, b) => (a >= b ? a : b), '');
    this.elementos.set(
      this.fuentes
        .flatMap((f) => f.cargados)
        .filter((m) => m.fecha >= corte)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    );
    this.totalElementos.set(this.fuentes.reduce((total, f) => total + f.totalElementos, 0));
    this.hayMas.set(pendientes.length > 0);
  }
}
