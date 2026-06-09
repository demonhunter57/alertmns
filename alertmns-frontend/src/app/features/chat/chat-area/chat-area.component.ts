import { Component, Input, OnInit, OnChanges, OnDestroy,
         SimpleChanges, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../core/services/message.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Channel } from '../../../core/models/channel.model';
import { User } from '../../../core/models/user.model';
import { Message, WsEvent } from '../../../core/models/message.model';
import { MessageItemComponent } from '../message-item/message-item.component';
import { ExportMenuComponent } from '../export-menu/export-menu.component';

/**
 * Composant zone de messages — cœur de l'interface de chat.
 *
 * Responsabilités :
 *  - Charger l'historique du canal actif via REST (getHistory)
 *  - S'abonner aux événements WebSocket du canal (watchChannel)
 *  - Gérer le scroll automatique vers le dernier message
 *  - Afficher les indicateurs de frappe (typing indicators)
 *  - Envoyer des messages via WebSocket
 *
 * OnChanges est utilisé pour détecter le changement de canal (@Input channel)
 * et recharger l'historique + changer les abonnements WebSocket.
 *
 * Architecture des événements WebSocket :
 *  message:new     → ajouter en fin de liste
 *  message:edited  → remplacer dans la liste
 *  message:deleted → supprimer de la liste
 *  message:reacted → mettre à jour les réactions
 *  typing:start    → ajouter userId aux typingUsers
 *  typing:stop     → retirer userId des typingUsers
 */
@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageItemComponent, ExportMenuComponent],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss'
})
export class ChatAreaComponent implements OnInit, OnChanges, OnDestroy {
  @Input() channel!: Channel;
  @Input() currentUser!: User;
  @Input() users: User[] = [];

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages = signal<Message[]>([]);
  typingUsers = signal<string[]>([]);
  messageInput = '';
  isLoading = signal(false);

  private subs = new Subscription();
  private typingTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private messageService: MessageService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadChannel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channel'] && !changes['channel'].firstChange) {
      this.subs.unsubscribe();
      this.subs = new Subscription();
      this.messages.set([]);
      this.typingUsers.set([]);
      this.loadChannel();
    }
  }

  private loadChannel(): void {
    this.isLoading.set(true);
    this.messageService.getHistory(this.channel.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: () => this.isLoading.set(false)
    });

    this.subscribeWebSocket();
  }

  private subscribeWebSocket(): void {
    const msgSub = this.wsService.watchChannel(this.channel.id).subscribe(
      (event: WsEvent) => this.handleWsEvent(event)
    );
    const typeSub = this.wsService.watchTyping(this.channel.id).subscribe(
      (event: WsEvent) => this.handleTypingEvent(event)
    );
    this.subs.add(msgSub);
    this.subs.add(typeSub);
  }

  private handleWsEvent(event: WsEvent): void {
    switch (event.type) {
      case 'message:new':
        this.messages.update(list => [...list, event.data as Message]);
        this.scrollToBottom();
        break;
      case 'message:edited': {
        const updated = event.data as Message;
        this.messages.update(list =>
          list.map(m => m.id === updated.id ? updated : m));
        break;
      }
      case 'message:deleted': {
        const { messageId } = event.data as { messageId: string; channelId: string };
        this.messages.update(list => list.filter(m => m.id !== messageId));
        break;
      }
      case 'message:reacted': {
        const reacted = event.data as Message;
        this.messages.update(list =>
          list.map(m => m.id === reacted.id ? reacted : m));
        break;
      }
    }
  }

  private handleTypingEvent(event: WsEvent): void {
    const userId = event.userId ?? '';
    if (userId === this.currentUser.id) return;

    if (event.type === 'typing:start') {
      this.typingUsers.update(list =>
        list.includes(userId) ? list : [...list, userId]);
    } else {
      this.typingUsers.update(list => list.filter(id => id !== userId));
    }
  }

  sendMessage(): void {
    const content = this.messageInput.trim();
    if (!content) return;

    this.wsService.sendMessage(this.channel.id, content);
    this.messageInput = '';
    this.wsService.stopTyping(this.channel.id);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInputChange(): void {
    this.wsService.startTyping(this.channel.id);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.wsService.stopTyping(this.channel.id);
    }, 2000);
  }

  getTypingUserNames(): string {
    return this.typingUsers()
      .map(id => this.users.find(u => u.id === id)?.displayName ?? 'Quelqu\'un')
      .join(', ');
  }

  onMessageDeleted(messageId: string): void {
    this.wsService.deleteMessage(messageId, this.channel.id);
  }

  onMessageEdited(payload: { messageId: string; content: string }): void {
    this.wsService.editMessage(payload.messageId, this.channel.id, payload.content);
  }

  onMessageReacted(payload: { messageId: string; emoji: string }): void {
    this.wsService.reactMessage(payload.messageId, this.channel.id, payload.emoji);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    clearTimeout(this.typingTimeout);
  }
}
