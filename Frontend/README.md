# Mis Finanzas · Frontend

App de Ionic 9 + Angular 21 (componentes standalone, sin zone.js) con Capacitor 8 para Android.

## Puesta en marcha

Requisitos: Node 22.12+ o 24, y el backend corriendo en `http://localhost:8090` (ver `Backend/mis-finanzas-backend`).

```bash
npm install
npx ionic serve
```

La app queda en `http://localhost:8100` (el CORS del backend ya permite ese origen).
La URL de la API está en `src/environments/environment.ts` (`apiUrl`).

## Estructura

```
src/app/
├── core/        ApiService, AuthService, StorageService, AvisoService, interceptor de auth
├── guards/      authGuard (pantallas privadas) y publicGuard (login y registro)
├── models/      DTO del backend
├── services/    un servicio por recurso de la API (gastos, ingresos, categorías, presupuestos, resumen, recurrentes, usuarios)
├── components/  componentes reutilizables (MovementCard, para gastos e ingresos)
├── shared/      cabecera común (logo, título y menú del avatar), EmptyState, ListaMovimientos (gastos e ingresos mezclados por fecha) e iniciales
└── pages/       login, registro, tabs (/inicio, /finanzas, /calendario, /vehiculos, /ia), inicio (resumen del mes), finanzas (gastos e ingresos), perfil y las hojas de nuevo movimiento y presupuesto
```

Las páginas solo hablan con los servicios; los servicios usan `ApiService`, que es el único que usa `HttpClient`.

## Sesión

- `POST /api/auth/login` devuelve el token. Con **Recordarme** se guarda en Capacitor Preferences
  (localStorage en web, SharedPreferences en Android); sin marcarlo, en `sessionStorage`.
- El interceptor añade `Authorization: Bearer <token>` y, ante un 401, cierra la sesión y vuelve al login.
  Los 400 (por ejemplo, contraseña actual incorrecta) no cierran la sesión.
- Los errores muestran el campo `mensaje` de la API en un toast.

## Comandos

| Comando | Para qué |
|---|---|
| `npx ionic serve` | Servidor de desarrollo en el puerto 8100 |
| `npm run build` | Compilación de producción en `www/` |
| `npm run eslint` | Lint |
| `npm run test:unit` | Pruebas unitarias (Vitest) |
