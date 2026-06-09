import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

/**
 * Service Angular gérant l'authentification et le profil utilisateur.
 *
 * Utilise les Signals Angular 17 pour l'état réactif du profil courant.
 * Le JWT est stocké dans localStorage sous la clé 'alertmns_token'.
 *
 * currentUser : Signal<User | null>
 *   Accessible depuis n'importe quel composant via authService.currentUser().
 *   Mis à jour automatiquement lors du login, register et updateProfile.
 *
 * Flux d'authentification :
 *   login() → POST /api/auth/login → stocke token + user en mémoire
 *   logout() → vide le token + redirige vers /login
 *   initFromStorage() : appelé au démarrage (app.config.ts) pour restaurer la session
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'alertmns_token';

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`,
      { username, password }
    ).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  register(username: string, email: string, password: string,
           displayName: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/register`,
      { username, email, password, displayName }
    ).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/auth/me`, data).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  initFromStorage(): void {
    const token = this.getToken();
    if (!token) return;
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: user => this.currentUser.set(user),
      error: () => this.logout()
    });
  }

  private handleAuthResponse(res: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    this.currentUser.set(res.user);
  }
}
