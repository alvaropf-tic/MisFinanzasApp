// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // URL base de la API del backend (Spring Boot)
  apiUrl: 'http://localhost:8090/api',
  // Solo en la app Android: direcciones alternativas de la API, en orden de preferencia
  apiUrls: undefined as string[] | undefined,
  // Solo en la app Android: service token de Cloudflare Access para las peticiones a esa dirección
  accesoCloudflare: undefined as { url: string; clientId: string; clientSecret: string } | undefined,
};
