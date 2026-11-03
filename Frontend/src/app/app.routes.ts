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
    path: 'gastos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/gastos/gastos.page').then((m) => m.GastosPage),
  },
  {
    path: '',
    redirectTo: 'gastos',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'gastos',
  },
];
