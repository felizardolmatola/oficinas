import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Exige sessão iniciada e perfil completo (contas Google novas passam primeiro por /completar-perfil). */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (!auth.user()) return router.createUrlTree(['/entrar']);
  if (!auth.profileComplete()) return router.createUrlTree(['/completar-perfil']);
  return true;
};

/** Exige apenas sessão iniciada. */
export const sessionGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ready;
  return auth.user() ? true : inject(Router).createUrlTree(['/entrar']);
};
