import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../models/message.model';
import { environment } from '../../../environments/environment';

/**
 * Service Angular pour les opérations REST sur les messages.
 *
 * La création de messages (send) passe par WebSocketService.sendMessage()
 * pour garantir la diffusion temps réel.
 *
 * Ce service gère :
 *  - getHistory   : chargement de l'historique au changement de canal
 *  - editMessage  : modification du contenu (peut aussi passer par WebSocket)
 *  - deleteMessage: suppression
 *  - react        : toggle réaction emoji
 *  - export       : téléchargement dans différents formats
 */
@Injectable({ providedIn: 'root' })
export class MessageService {

  constructor(private http: HttpClient) {}

  getHistory(channelId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${environment.apiUrl}/messages/${channelId}`);
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.patch<Message>(
      `${environment.apiUrl}/messages/${messageId}`,
      { content }
    );
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/messages/${messageId}`
    );
  }

  react(messageId: string, emoji: string): Observable<Message> {
    return this.http.post<Message>(
      `${environment.apiUrl}/messages/${messageId}/react`,
      { emoji }
    );
  }

  exportJson(channelId: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/export/${channelId}/json`,
      { responseType: 'blob' }
    );
  }

  exportCsv(channelId: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/export/${channelId}/csv`,
      { responseType: 'blob' }
    );
  }

  exportXml(channelId: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/export/${channelId}/xml`,
      { responseType: 'blob' }
    );
  }
}
