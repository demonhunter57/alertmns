import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Définition des routes de l'application.
 *
 * /           → redirige vers /chat (lazy-loaded)
 * /login      → page de connexion (chargée immédiatement — petite taille)
 * /chat       → interface principale (protégée par authGuard)
 *
 * loadComponent() : lazy-loading — le bundle Angular ne charge les composants
 * que lorsque la route est activée. Réduit le bundle initial significativement.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/chat',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./features/chat/chat.component')
        .then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/chat'
  }
];
