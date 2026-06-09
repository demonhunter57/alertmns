import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../core/models/channel.model';
import { User } from '../../../core/models/user.model';

/**
 * Composant Sidebar — liste des canaux et des utilisateurs.
 *
 * Reçoit via @Input :
 *  - channels     : liste des canaux accessibles
 *  - users        : liste de tous les utilisateurs
 *  - activeChannel: canal actuellement sélectionné
 *  - currentUser  : utilisateur connecté
 *
 * Émet via @Output :
 *  - channelSelected : quand l'utilisateur clique sur un canal
 *  - logoutRequested : quand l'utilisateur clique sur Déconnexion
 *
 * La liste est divisée en deux sections :
 *  - Canaux publics (#)
 *  - Canaux privés (🔒)
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() channels: Channel[] = [];
  @Input() users: User[] = [];
  @Input() activeChannel: Channel | null = null;
  @Input() currentUser: User | null = null;

  @Output() channelSelected = new EventEmitter<Channel>();
  @Output() logoutRequested = new EventEmitter<void>();

  get publicChannels(): Channel[] {
    return this.channels.filter(c => !c.isPrivate);
  }

  get privateChannels(): Channel[] {
    return this.channels.filter(c => c.isPrivate);
  }

  get onlineUsers(): User[] {
    return this.users.filter(u => u.status === 'ONLINE' || u.status === 'AWAY');
  }

  selectChannel(channel: Channel): void {
    this.channelSelected.emit(channel);
  }

  logout(): void {
    this.logoutRequested.emit();
  }

  statusColor(status: string): string {
    switch (status) {
      case 'ONLINE': return '#2ecc71';
      case 'AWAY':   return '#f39c12';
      default:       return '#636e72';
    }
  }
}
