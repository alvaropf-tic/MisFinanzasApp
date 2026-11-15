export const environment = {
  production: true,
  // En el homelab la web y la API van por el mismo Nginx: /api se reenvía al backend (sin CORS)
  apiUrl: '/api',
  apiUrls: undefined as string[] | undefined,
  // En el navegador, Cloudflare Access usa su propia cookie (código por email): no hace falta service token
  accesoCloudflare: undefined as { url: string; clientId: string; clientSecret: string } | undefined,
};
