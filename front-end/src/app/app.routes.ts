import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

// Mapa central de rotas da aplicacao.
export const routes: Routes = [
  // Redirecionamento padrao para a tela de login.
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    // Rotas publicas de autenticacao e acesso negado.
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/auth/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  // Rotas protegidas por autenticacao.
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
    // Tela dedicada ao cadastro de entrada/saida de acesso.
    path: 'acessos/registrar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/acessos/registrar-acesso/registrar-acesso').then(
        (m) => m.RegistrarAcesso,
      ),
  },
  // Fallback para rotas inexistentes.
  {
    path: '**',
    redirectTo: 'login',
  },
];
