import type { Recurrente } from '../models/recurrente.model';

import { cobrosEnMes, siguienteCobro } from './proyeccion-recurrentes';

const recurrente = (cambios: Partial<Recurrente>): Recurrente => ({
  tipo: 'gasto',
  id: 1,
  importe: 9.99,
  descripcion: 'Netflix',
  metodo: 'TARJETA',
  periodicidad: 'MENSUAL',
  proximaFecha: '2026-11-15',
  fechaInicio: '2026-01-15',
  fechaFin: null,
  activo: true,
  categoriaId: 1,
  categoriaNombre: 'Suscripciones',
  ...cambios,
});

describe('siguienteCobro', () => {
  it('respeta el día de referencia en los meses cortos y vuelve a él después', () => {
    expect(siguienteCobro('2026-01-31', 'MENSUAL', 31)).toBe('2026-02-28');
    expect(siguienteCobro('2026-02-28', 'MENSUAL', 31)).toBe('2026-03-31');
    expect(siguienteCobro('2028-01-31', 'MENSUAL', 31)).toBe('2028-02-29');
  });

  it('suma semanas, trimestres y años', () => {
    expect(siguienteCobro('2026-12-29', 'SEMANAL', 29)).toBe('2027-01-05');
    expect(siguienteCobro('2026-11-30', 'TRIMESTRAL', 30)).toBe('2027-02-28');
    expect(siguienteCobro('2026-03-10', 'ANUAL', 10)).toBe('2027-03-10');
  });
});

describe('cobrosEnMes', () => {
  it('un mensual da un cobro al mes desde su próxima fecha', () => {
    expect(cobrosEnMes(recurrente({}), 2026, 11)).toEqual(['2026-11-15']);
    expect(cobrosEnMes(recurrente({}), 2027, 2)).toEqual(['2027-02-15']);
    // Antes de la próxima fecha ya son gastos generados: no se proyectan
    expect(cobrosEnMes(recurrente({}), 2026, 10)).toEqual([]);
  });

  it('un semanal da varios cobros en el mes', () => {
    const semanal = recurrente({ periodicidad: 'SEMANAL', proximaFecha: '2026-11-02', fechaInicio: '2026-11-02' });
    expect(cobrosEnMes(semanal, 2026, 11)).toEqual([
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
    ]);
  });

  it('no pasa de la fecha de fin ni proyecta los pausados', () => {
    expect(cobrosEnMes(recurrente({ fechaFin: '2026-12-31' }), 2027, 1)).toEqual([]);
    expect(cobrosEnMes(recurrente({ activo: false }), 2026, 11)).toEqual([]);
  });
});
