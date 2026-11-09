// App Android (Capacitor): la web va dentro del APK, así que la API se llama por la dirección completa de la Pi.
// Se prueba primero la red de casa (sin VPN) y, si no responde, Tailscale (fuera de casa, con la VPN activa).
const enCasa = 'http://192.168.68.58:8095/api';
const porTailscale = 'http://homelab.tail168d76.ts.net:8095/api';

export const environment = {
  production: true,
  apiUrl: porTailscale,
  apiUrls: [enCasa, porTailscale] as string[] | undefined,
};
