import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

/**
 * Configuration centrale de l'application Angular 17 standalone.
 *
 * Providers enregistrés :
 *  - provideRouter       : routeur avec les routes définies dans app.routes.ts
 *  - provideHttpClient   : client HTTP avec l'intercepteur JWT
 *  - provideAnimations   : animations Angular (pour les transitions)
 *  - APP_INITIALIZER     : restaure la session depuis localStorage au démarrage
 *                          Appelle authService.initFromStorage() avant le premier rendu.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.initFromStorage(),
      deps: [AuthService],
      multi: true
    }
  ]
};
