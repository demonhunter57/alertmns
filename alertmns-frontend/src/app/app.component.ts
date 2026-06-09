import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Composant racine de l'application Angular.
 * Contient uniquement le <router-outlet> qui affiche le composant actif.
 * Toute la logique applicative est dans les composants features.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent {}
