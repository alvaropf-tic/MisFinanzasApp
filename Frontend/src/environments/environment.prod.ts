export const environment = {
  production: true,
  // En el homelab la web y la API van por el mismo Nginx: /api se reenvía al backend (sin CORS)
  apiUrl: '/api',
  apiUrls: undefined as string[] | undefined,
};
