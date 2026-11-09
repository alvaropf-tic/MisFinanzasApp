import type { Routes } from '@angular/router';

import { authGuard, publicGuard } from './guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'estadisticas',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/estadisticas/estadisticas.page').then((m) => m.EstadisticasPage),
  },
  // Textos legales: se ven sin sesión (desde el registro) y con ella (desde Configuración)
  {
    path: 'privacidad',
    loadComponent: () => import('./pages/legal/legal.page').then((m) => m.LegalPage),
    data: { documento: 'privacidad' },
  },
  {
    path: 'terminos',
    loadComponent: () => import('./pages/legal/legal.page').then((m) => m.LegalPage),
    data: { documento: 'terminos' },
  },
  {
    path: 'configuracion',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/configuracion/configuracion.page').then((m) => m.ConfiguracionPage),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
  },
  // Detalle de un vehículo, encima de las pestañas (antes de ellas para que no lo tape /vehiculos)
  {
    path: 'vehiculos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/vehiculo-detalle/vehiculo-detalle.page').then((m) => m.VehiculoDetallePage),
  },
  {
    path: 'objetivos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/objetivos/objetivos.page').then((m) => m.ObjetivosPage),
  },
  {
    path: 'objetivos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/objetivo-detalle/objetivo-detalle.page').then((m) => m.ObjetivoDetallePage),
  },
  {
    path: 'recurrentes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/recurrentes/recurrentes.page').then((m) => m.RecurrentesPage),
  },
  // Antigua URL de la lista de gastos
  {
    path: 'gastos',
    redirectTo: 'finanzas',
  },
  // Pestañas sin prefijo en la URL: /inicio, /finanzas, /calendario, /vehiculos, /ia
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'finanzas',
        loadComponent: () => import('./pages/finanzas/finanzas.page').then((m) => m.FinanzasPage),
      },
      {
        path: 'calendario',
        loadComponent: () => import('./pages/calendario/calendario.page').then((m) => m.CalendarioPage),
      },
      {
        path: 'vehiculos',
        loadComponent: () => import('./pages/vehiculos/vehiculos.page').then((m) => m.VehiculosPage),
      },
      { path: 'ia', loadComponent: () => import('./pages/ia/ia.page').then((m) => m.IaPage) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
