import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.misfinanzas.app',
  appName: 'Mis Finanzas',
  webDir: 'www',
  server: {
    // La API de la Pi va por HTTP dentro de Tailscale (que ya cifra el tráfico): la app se sirve también por
    // http://localhost para que Android no bloquee las peticiones como contenido mixto
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
