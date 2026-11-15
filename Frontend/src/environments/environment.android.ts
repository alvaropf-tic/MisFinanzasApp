import { credencialesCloudflare } from './acceso-cloudflare';

// App Android (Capacitor): la web va dentro del APK, así que la API se llama por la dirección completa de la Pi.
// Se prueba primero la red de casa (sin VPN); fuera de casa, Cloudflare (sin VPN) y, como respaldo, Tailscale.
const enCasa = 'http://192.168.68.58:8095/api';
const porCloudflare = 'https://misfinanzas.apftech.dev/api';
const porTailscale = 'http://homelab.tail168d76.ts.net:8095/api';

export const environment = {
  production: true,
  apiUrl: porCloudflare,
  apiUrls: [enCasa, porCloudflare, porTailscale] as string[] | undefined,
  // Cloudflare Access deja pasar a la app con un service token (cabeceras CF-Access-Client-Id/Secret)
  accesoCloudflare: { url: porCloudflare, ...credencialesCloudflare } as AccesoCloudflare | undefined,
};

interface AccesoCloudflare {
  url: string;
  clientId: string;
  clientSecret: string;
}
