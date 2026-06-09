import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { Observable, Subject, filter, map } from 'rxjs';
import { IMessage } from '@stomp/rx-stomp';
import { AuthService } from './auth.service';
import { WsEvent } from '../models/message.model';
import { environment } from '../../../environments/environment';
import SockJS from 'sockjs-client';

/**
 * Service Angular gérant la connexion WebSocket STOMP avec le serveur Spring Boot.
 *
 * Utilise la bibliothèque @stomp/rx-stomp qui expose une API RxJS (Observables)
 * sur le protocole STOMP over WebSocket (avec fallback SockJS).
 *
 * Cycle de vie :
 *  connect()    : à appeler après login, établit la connexion STOMP
 *  disconnect() : à appeler lors du logout
 *  Le service implémente OnDestroy pour nettoyer la connexion si le service
 *  est détruit (rare pour un service providedIn:'root' mais bonne pratique).
 *
 * Authentification STOMP :
 *  Le JWT est transmis dans le header STOMP "Authorization" lors du CONNECT.
 *  Spring WebSocketConfig.configureClientInboundChannel() le valide et injecte
 *  le Principal dans le contexte de sécurité WebSocket.
 *
 * Abonnements publics :
 *  watchChannel(channelId)   → /topic/channel.{channelId}
 *  watchTyping(channelId)    → /topic/channel.{channelId}.typing
 *  watchUsers()              → /topic/users
 *  watchNotifications()      → /user/queue/notifications
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {

  private rxStomp = new RxStomp();

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const config: RxStompConfig = {
      webSocketFactory: () => new SockJS(environment.wsUrl) as any,
      connectHeaders: { Authorization: `Bearer ${token}` },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 5000,
    };

    this.rxStomp.configure(config);
    this.rxStomp.activate();
  }

  disconnect(): void {
    this.rxStomp.deactivate();
  }

  /** Envoie un message dans un canal via STOMP. */
  sendMessage(channelId: string, content: string): void {
    this.rxStomp.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ channelId, content })
    });
  }

  /** Envoie une édition de message via STOMP. */
  editMessage(messageId: string, channelId: string, content: string): void {
    this.rxStomp.publish({
      destination: '/app/chat.edit',
      body: JSON.stringify({ messageId, channelId, content })
    });
  }

  /** Envoie une suppression de message via STOMP. */
  deleteMessage(messageId: string, channelId: string): void {
    this.rxStomp.publish({
      destination: '/app/chat.delete',
      body: JSON.stringify({ messageId, channelId })
    });
  }

  /** Envoie un toggle de réaction via STOMP. */
  reactMessage(messageId: string, channelId: string, emoji: string): void {
    this.rxStomp.publish({
      destination: '/app/chat.react',
      body: JSON.stringify({ messageId, channelId, emoji })
    });
  }

  startTyping(channelId: string): void {
    this.rxStomp.publish({
      destination: '/app/typing.start',
      body: JSON.stringify({ channelId })
    });
  }

  stopTyping(channelId: string): void {
    this.rxStomp.publish({
      destination: '/app/typing.stop',
      body: JSON.stringify({ channelId })
    });
  }

  sendDm(recipientId: string, content: string): void {
    this.rxStomp.publish({
      destination: '/app/dm.send',
      body: JSON.stringify({ recipientId, content })
    });
  }

  setStatus(status: string, absentUntil?: string, absentMessage?: string): void {
    this.rxStomp.publish({
      destination: '/app/status.set',
      body: JSON.stringify({ status, absentUntil, absentMessage })
    });
  }

  /** Observable des événements d'un canal spécifique. */
  watchChannel(channelId: string): Observable<WsEvent> {
    return this.rxStomp
      .watch(`/topic/channel.${channelId}`)
      .pipe(map((msg: IMessage) => JSON.parse(msg.body) as WsEvent));
  }

  /** Observable des indicateurs de frappe d'un canal. */
  watchTyping(channelId: string): Observable<WsEvent> {
    return this.rxStomp
      .watch(`/topic/channel.${channelId}.typing`)
      .pipe(map((msg: IMessage) => JSON.parse(msg.body) as WsEvent));
  }

  /** Observable des statuts utilisateurs (broadcast global). */
  watchUsers(): Observable<WsEvent> {
    return this.rxStomp
      .watch('/topic/users')
      .pipe(map((msg: IMessage) => JSON.parse(msg.body) as WsEvent));
  }

  /** Observable des notifications DM personnelles. */
  watchNotifications(): Observable<WsEvent> {
    return this.rxStomp
      .watch('/user/queue/notifications')
      .pipe(map((msg: IMessage) => JSON.parse(msg.body) as WsEvent));
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
