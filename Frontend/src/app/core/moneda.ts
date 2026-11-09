/** Monedas que se pueden elegir en Configuración. Solo cambia cómo se muestran los importes: no se convierte nada. */
export const MONEDAS: { codigo: string; nombre: string }[] = [
  { codigo: 'EUR', nombre: 'Euro' },
  { codigo: 'USD', nombre: 'Dólar estadounidense' },
  { codigo: 'GBP', nombre: 'Libra esterlina' },
  { codigo: 'CHF', nombre: 'Franco suizo' },
  { codigo: 'MXN', nombre: 'Peso mexicano' },
  { codigo: 'ARS', nombre: 'Peso argentino' },
  { codigo: 'COP', nombre: 'Peso colombiano' },
  { codigo: 'CLP', nombre: 'Peso chileno' },
  { codigo: 'PEN', nombre: 'Sol peruano' },
];

const CLAVE = 'mf.moneda';

/** Moneda elegida (por defecto, euro). La usan el CurrencyPipe (DEFAULT_CURRENCY_CODE) y los formatos en código. */
export function monedaActual(): string {
  try {
    const guardada = localStorage.getItem(CLAVE);
    if (guardada && MONEDAS.some((m) => m.codigo === guardada)) {
      return guardada;
    }
  } catch {
    // Sin almacenamiento: euro
  }
  return 'EUR';
}

/** Símbolo de la moneda para los campos de importe ("€", "US$"…). */
export function simboloMoneda(codigo = monedaActual()): string {
  return (
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: codigo })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? codigo
  );
}

/**
 * Guarda la moneda y recarga la app: los formatos se crean al arrancar, así que es la forma de que todo
 * (listas, gráficos, hojas) pase a la nueva a la vez.
 */
export function cambiarMoneda(codigo: string): void {
  try {
    localStorage.setItem(CLAVE, codigo);
  } catch {
    return;
  }
  location.reload();
}
