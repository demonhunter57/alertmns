import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de route fonctionnel (Angular 17 standalone).
 *
 * Protège les routes nécessitant une authentification.
 * Si l'utilisateur n'est pas connecté (pas de JWT en localStorage),
 * il est redirigé vers /login.
 *
 * Utilisation dans app.routes.ts :
 *   { path: 'chat', component: ChatComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
