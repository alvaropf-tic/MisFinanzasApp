import { from, of } from 'rxjs';

import type { Gasto } from '../models/gasto.model';
import type { Ingreso } from '../models/ingreso.model';
import type { Movimiento } from '../models/movimiento.model';
import type { Pagina } from '../models/pagina.model';

import { ListaMovimientos, type PedirPagina } from './lista-movimientos';

const gasto = (id: number, dia: number): Gasto => ({
  id,
  importe: 1,
  fecha: `2026-11-${String(dia).padStart(2, '0')}T10:00:00`,
  descripcion: null,
  metodoPago: 'TARJETA',
  categoriaId: 1,
  categoriaNombre: 'Comida',
  origen: 'MANUAL',
  ticketId: null,
  vehiculoId: null,
  registroId: null,
});

const ingreso = (id: number, dia: number): Ingreso => ({
  id,
  importe: 1,
  fecha: `2026-11-${String(dia).padStart(2, '0')}T09:00:00`,
  descripcion: null,
  metodoIngreso: 'TRANSFERENCIA',
  categoriaIngresoId: 1,
  categoriaIngresoNombre: 'Nómina',
  recurrente: false,
});

/** Simula un listado del backend: ordenado por fecha descendente y paginado. */
function fuente(movimientos: Movimiento[], tamanio: number): PedirPagina {
  const ordenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (pagina) =>
    of<Pagina<Movimiento>>({
      contenido: ordenados.slice(pagina * tamanio, (pagina + 1) * tamanio),
      pagina,
      tamanio,
      totalElementos: ordenados.length,
      totalPaginas: Math.ceil(ordenados.length / tamanio),
    });
}

const fechas = (lista: ListaMovimientos): string[] => lista.elementos().map((m) => m.fecha);
const ordenDescendente = (valores: string[]): boolean => valores.every((v, i) => i === 0 || valores[i - 1] >= v);

describe('ListaMovimientos', () => {
  it('mezcla las fuentes por fecha y no muestra nada que pueda quedar desordenado', async () => {
    // Gastos los días 30..21 y un ingreso cada 3 días: la primera página de cada uno no llega igual de atrás
    const gastos = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21].map((dia, i) => gasto(i + 1, dia));
    const ingresos = [30, 27, 24, 21, 18].map((dia, i) => ingreso(i + 1, dia));
    const lista = new ListaMovimientos(() => undefined);

    await lista.recargar([fuente(gastos, 3), fuente(ingresos, 3)]);

    // Gastos cargados hasta el 28 e ingresos hasta el 24: solo se puede mostrar hasta el 28
    expect(fechas(lista).every((f) => f >= '2026-11-28')).toBe(true);
    expect(ordenDescendente(fechas(lista))).toBe(true);
    expect(lista.totalElementos()).toBe(15);
    expect(lista.hayMas()).toBe(true);

    while (lista.hayMas()) {
      await lista.cargarMas();
      expect(ordenDescendente(fechas(lista))).toBe(true);
    }

    expect(lista.elementos()).toHaveLength(15);
  });

  it('con una sola fuente se comporta como una lista paginada normal', async () => {
    const lista = new ListaMovimientos(() => undefined);
    await lista.recargar([fuente([gasto(1, 3), gasto(2, 2), gasto(3, 1)], 2)]);

    expect(lista.elementos()).toHaveLength(2);
    await lista.cargarMas();
    expect(lista.elementos().map((m) => m.id)).toEqual([1, 2, 3]);
    expect(lista.hayMas()).toBe(false);
  });

  it('ignora la respuesta de una recarga anterior si ha cambiado el filtro entretanto', async () => {
    const lista = new ListaMovimientos(() => undefined);
    let resolverLenta: (p: Pagina<Movimiento>) => void = () => undefined;
    const lenta: PedirPagina = () => from(new Promise<Pagina<Movimiento>>((resolver) => (resolverLenta = resolver)));

    const primera = lista.recargar([lenta]);
    await lista.recargar([fuente([ingreso(7, 5)], 20)], { limpiar: true });
    resolverLenta({ contenido: [gasto(1, 9)], pagina: 0, tamanio: 20, totalElementos: 1, totalPaginas: 1 });
    await primera;

    expect(lista.elementos().map((m) => m.id)).toEqual([7]);
  });
});
