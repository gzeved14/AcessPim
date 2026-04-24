import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perfil } from '../models/perfil.enum';
import { AuthService } from './auth.service';

export const roleGuard = (perfil: Perfil): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.hasRole(perfil)
      ? true
      : router.createUrlTree(['/forbidden']);
  };
};
