import { User } from './user.model';

/** Modèle TypeScript représentant un message dans un canal. */
export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  reactions: Record<string, string[]>;
  createdAt: string;
  editedAt?: string;
}

/** Événement WebSocket reçu depuis le serveur. */
export interface WsEvent {
  type: 'message:new' | 'message:edited' | 'message:deleted' | 'message:reacted'
      | 'typing:start' | 'typing:stop' | 'user:status' | 'notification';
  data?: unknown;
  userId?: string;
}
