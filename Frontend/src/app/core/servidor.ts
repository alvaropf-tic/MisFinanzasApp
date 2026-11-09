import { environment } from '../../environments/environment';

/**
 * Dirección de la API en uso. En la web y en desarrollo es fija (`environment.apiUrl`). En la app Android hay
 * varias: primero la de casa (red local, sin VPN) y después la de Tailscale; se elige la primera que responde.
 */
let actual = environment.apiUrl;

const ESPERA_MS = 1500;

export function apiBase(): string {
  return actual;
}

/** Prueba las direcciones en orden y se queda con la primera que contesta (la última si ninguna lo hace). */
export async function elegirServidor(): Promise<void> {
  const candidatas = environment.apiUrls ?? [];
  if (candidatas.length < 2) {
    return;
  }
  // Se prueban todas a la vez y gana la primera de la lista que responda: así fuera de casa no se espera de más
  const resultados = candidatas.map((url) => responde(url));
  for (let i = 0; i < candidatas.length; i++) {
    if (await resultados[i]) {
      actual = candidatas[i];
      return;
    }
  }
  actual = candidatas[candidatas.length - 1];
}

/** Vuelve a elegir al volver a la app o recuperar la conexión (p. ej. al llegar a casa o al salir). */
export function vigilarServidor(): void {
  if (!environment.apiUrls?.length) {
    return;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void elegirServidor();
    }
  });
  window.addEventListener('online', () => void elegirServidor());
}

// Basta con que el servidor conteste (no-cors: no hace falta leer la respuesta); un fallo de red o el tiempo
// agotado cuentan como "no responde"
async function responde(apiUrl: string): Promise<boolean> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ESPERA_MS);
  try {
    await fetch(apiUrl.replace(/\/api$/, '/'), { mode: 'no-cors', cache: 'no-store', signal: control.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}
