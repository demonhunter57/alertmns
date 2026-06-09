import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../core/models/message.model';
import { User } from '../../../core/models/user.model';

/**
 * Composant d'affichage d'un message individuel.
 *
 * Fonctionnalités :
 *  - Affichage du contenu, auteur, date, badge "(modifié)"
 *  - Mode édition inline : double-clic sur le message pour éditer
 *  - Suppression (auteur uniquement)
 *  - Réactions emoji (toggle via clic sur existant ou picker)
 *
 * Événements émis au composant parent (ChatAreaComponent) :
 *  deleted : messageId string
 *  edited  : { messageId, content }
 *  reacted : { messageId, emoji }
 *
 * La logique d'autorisation côté UI (bouton delete visible uniquement
 * pour l'auteur) est une optimisation d'UX — le backend valide également.
 */
@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-item.component.html',
  styleUrl: './message-item.component.scss'
})
export class MessageItemComponent {
  @Input() message!: Message;
  @Input() currentUser!: User;

  @Output() deleted = new EventEmitter<string>();
  @Output() edited = new EventEmitter<{ messageId: string; content: string }>();
  @Output() reacted = new EventEmitter<{ messageId: string; emoji: string }>();

  isEditing = signal(false);
  editContent = '';
  showActions = signal(false);

  readonly QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  get isAuthor(): boolean {
    return this.message.author.id === this.currentUser.id;
  }

  get reactionEntries(): Array<{ emoji: string; users: string[] }> {
    return Object.entries(this.message.reactions ?? {})
      .map(([emoji, users]) => ({ emoji, users: users as string[] }));
  }

  get formattedDate(): string {
    const date = new Date(this.message.createdAt);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  startEdit(): void {
    this.editContent = this.message.content;
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editContent = '';
  }

  submitEdit(): void {
    const content = this.editContent.trim();
    if (!content || content === this.message.content) {
      this.cancelEdit();
      return;
    }
    this.edited.emit({ messageId: this.message.id, content });
    this.isEditing.set(false);
  }

  onEditKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitEdit();
    }
    if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  delete(): void {
    this.deleted.emit(this.message.id);
  }

  react(emoji: string): void {
    this.reacted.emit({ messageId: this.message.id, emoji });
  }

  hasUserReacted(users: string[]): boolean {
    return users.includes(this.currentUser.id);
  }
}
