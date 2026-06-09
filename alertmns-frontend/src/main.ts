import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Point d'entrée Angular 17 standalone.
 * bootstrapApplication remplace le NgModule racine traditionnel.
 * La configuration (providers, routes) est centralisée dans app.config.ts.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
