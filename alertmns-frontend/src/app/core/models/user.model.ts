/**
 * Modèle TypeScript représentant un utilisateur AlertMNS.
 * Miroir exact du UserResponse Java (sans passwordHash).
 */
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  initials: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  absentUntil?: string;
  absentMessage?: string;
  color: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
