import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Channel } from '../models/channel.model';
import { environment } from '../../../environments/environment';

/**
 * Service Angular pour la gestion des canaux via l'API REST.
 *
 * Tous les appels HTTP incluent automatiquement le JWT via AuthInterceptor.
 * Les Observables retournés sont consommés dans les composants ou services appelants.
 */
@Injectable({ providedIn: 'root' })
export class ChannelService {

  constructor(private http: HttpClient) {}

  getChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${environment.apiUrl}/channels`);
  }

  getChannel(id: string): Observable<Channel> {
    return this.http.get<Channel>(`${environment.apiUrl}/channels/${id}`);
  }

  createChannel(name: string, description: string,
                isPrivate: boolean): Observable<Channel> {
    return this.http.post<Channel>(`${environment.apiUrl}/channels`,
      { name, description, isPrivate });
  }

  updateMembers(channelId: string, action: 'add' | 'remove',
                userIds: string[]): Observable<Channel> {
    return this.http.patch<Channel>(
      `${environment.apiUrl}/channels/${channelId}/members`,
      { action, userIds }
    );
  }

  deleteChannel(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/channels/${id}`);
  }
}
