import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

import { authGuard, publicGuard } from './guards/auth.guards';

const proximamente = (): Promise<Type<unknown>> =>
  import('./pages/proximamente/proximamente.page').then((m) => m.ProximamentePage);

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
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
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
      { path: 'calendario', loadComponent: proximamente, data: { titulo: 'Calendario' } },
      { path: 'vehiculos', loadComponent: proximamente, data: { titulo: 'Vehículos' } },
      { path: 'ia', loadComponent: proximamente, data: { titulo: 'IA' } },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
