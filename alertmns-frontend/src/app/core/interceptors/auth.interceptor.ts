import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Intercepteur HTTP fonctionnel (Angular 17 standalone).
 *
 * Injecte automatiquement le JWT Bearer dans le header Authorization
 * de toutes les requêtes HTTP sortantes vers l'API.
 *
 * Si aucun token n'est disponible (utilisateur non connecté),
 * la requête passe sans modification — Spring Security retournera
 * HTTP 401 pour les endpoints protégés.
 *
 * Utilisation dans app.config.ts :
 *   provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
