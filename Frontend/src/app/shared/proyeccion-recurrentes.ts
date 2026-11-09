import type { Recordatorio } from '../models/recordatorio.model';
import type { Periodicidad, Recurrente } from '../models/recurrente.model';

/** Fecha sin hora "2026-11-15" a partir de sus partes (mes 1-12). */
export function textoFecha(anio: number, mes: number, dia: number): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${anio}-${dos(mes)}-${dos(dia)}`;
}

/** Días que tiene un mes (1-12). */
export function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

/**
 * Siguiente cobro, igual que `Periodicidad.siguienteFecha` del backend: los mensuales, trimestrales, semestrales
 * y anuales respetan el día de referencia (el de `fechaInicio`), así uno del 31 se cobra el 30 o el 28 en los
 * meses cortos y vuelve al 31 cuando el mes lo tiene. Las fechas son texto "AAAA-MM-DD".
 */
export function siguienteCobro(fecha: string, periodicidad: Periodicidad, diaReferencia: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (periodicidad === 'SEMANAL') {
    const siguiente = new Date(anio, mes - 1, dia + 7);
    return textoFecha(siguiente.getFullYear(), siguiente.getMonth() + 1, siguiente.getDate());
  }
  const meses = { MENSUAL: 1, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 }[periodicidad];
  // Día 1 para no desbordar al sumar meses (31 de enero + 1 mes no debe saltar a marzo)
  const destino = new Date(anio, mes - 1 + meses, 1);
  const anioDestino = destino.getFullYear();
  const mesDestino = destino.getMonth() + 1;
  return textoFecha(anioDestino, mesDestino, Math.min(diaReferencia, diasDelMes(anioDestino, mesDestino)));
}

/**
 * Cobros previstos de un recurrente activo dentro de un mes (1-12): desde su próxima fecha, sin pasar de su
 * fecha de fin. Los anteriores a `proximaFecha` ya son movimientos generados, así que no se repiten aquí.
 */
export function cobrosEnMes(
  recurrente: Pick<Recurrente, 'activo' | 'proximaFecha' | 'fechaInicio' | 'fechaFin' | 'periodicidad'>,
  anio: number,
  mes: number,
): string[] {
  if (!recurrente.activo) {
    return [];
  }
  const inicioMes = textoFecha(anio, mes, 1);
  const finMes = textoFecha(anio, mes, diasDelMes(anio, mes));
  const diaReferencia = Number(recurrente.fechaInicio.split('-')[2]);
  const cobros: string[] = [];
  let fecha = recurrente.proximaFecha;
  while (fecha <= finMes) {
    if (recurrente.fechaFin !== null && fecha > recurrente.fechaFin) {
      break;
    }
    if (fecha >= inicioMes) {
      cobros.push(fecha);
    }
    fecha = siguienteCobro(fecha, recurrente.periodicidad, diaReferencia);
  }
  return cobros;
}

/**
 * Día en que cae un recordatorio dentro de un mes (1-12), o null si no cae. Los mensuales y anuales repiten el día
 * de su fecha (el 31 pasa al último día de los meses cortos) desde esa fecha en adelante.
 */
export function recordatorioEnMes(
  recordatorio: Pick<Recordatorio, 'fecha' | 'repeticion'>,
  anio: number,
  mes: number,
): string | null {
  const [a, m, d] = recordatorio.fecha.split('-').map(Number);
  const inicio = a * 12 + m;
  const actual = anio * 12 + mes;
  if (actual < inicio) {
    return null;
  }
  const dia = Math.min(d, diasDelMes(anio, mes));
  switch (recordatorio.repeticion) {
    case 'NINGUNA':
      return actual === inicio ? recordatorio.fecha : null;
    case 'MENSUAL':
      return textoFecha(anio, mes, dia);
    case 'ANUAL':
      return mes === m ? textoFecha(anio, mes, dia) : null;
  }
}
