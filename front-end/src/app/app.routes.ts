import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/auth/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'colaboradores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/colaboradores/colaboradores').then((m) => m.Colaboradores),
  },
  {
    path: 'areas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/areas/areas').then((m) => m.Areas),
  },
  {
    path: 'acessos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/acessos/acessos').then((m) => m.Acessos),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
