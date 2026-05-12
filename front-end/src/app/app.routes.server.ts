import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'areas/editar/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'colaboradores',
    renderMode: RenderMode.Client
  },
  {
    path: 'colaboradores/novo',
    renderMode: RenderMode.Client
  },
  {
    path: 'colaboradores/editar/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];