import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';

/**
 * Composant de connexion AlertMNS.
 *
 * Gère deux modes via le signal isRegisterMode :
 *  - mode login    : username + password
 *  - mode register : username + email + password + displayName
 *
 * Après un login/register réussi :
 *  1. AuthService stocke le JWT et l'utilisateur courant
 *  2. WebSocketService.connect() établit la connexion STOMP
 *  3. Navigation vers /chat
 *
 * Les Signals Angular 17 remplacent les variables d'instance pour
 * déclencher la détection de changements de façon plus efficace.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isRegisterMode = signal(false);
  isLoading = signal(false);
  error = signal('');

  username = '';
  password = '';
  email = '';
  displayName = '';

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router
  ) {}

  submit(): void {
    this.error.set('');
    this.isLoading.set(true);

    const obs = this.isRegisterMode()
      ? this.authService.register(this.username, this.email,
          this.password, this.displayName)
      : this.authService.login(this.username, this.password);

    obs.subscribe({
      next: () => {
        this.wsService.connect();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur de connexion');
        this.isLoading.set(false);
      }
    });
  }

  toggleMode(): void {
    this.isRegisterMode.update(v => !v);
    this.error.set('');
  }
}
