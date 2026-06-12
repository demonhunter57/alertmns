import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChannelService } from '../../core/services/channel.service';
import { UserService } from '../../core/services/user.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Channel } from '../../core/models/channel.model';
import { User } from '../../core/models/user.model';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ChatAreaComponent } from './chat-area/chat-area.component';

/**
 * Composant principal de l'interface de chat.
 *
 * Architecture :
 *  - ChatComponent : composant orchestrateur (shell)
 *    ├── SidebarComponent : liste des canaux + utilisateurs
 *    └── ChatAreaComponent : zone de messages du canal actif
 *
 * Responsabilités :
 *  - Charge les canaux et les utilisateurs au démarrage
 *  - Maintient le canal actif (activeChannel signal)
 *  - Écoute les mises à jour de statut utilisateur via WebSocket
 *  - Gère le logout
 *
 * Communication inter-composants :
 *  - Signal activeChannel partagé via @Input au ChatAreaComponent
 *  - Événement (channelSelected) émis par SidebarComponent
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ChatAreaComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  channels = signal<Channel[]>([]);
  users = signal<User[]>([]);
  activeChannel = signal<Channel | null>(null);
  isDarkMode = signal<boolean>(localStorage.getItem('theme') !== 'light');

  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    private channelService: ChannelService,
    private userService: UserService,
    private wsService: WebSocketService,
    private router: Router
  ) {
    effect(() => {
      if (this.isDarkMode()) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.watchUserStatuses();
  }

  private loadInitialData(): void {
    this.channelService.getChannels().subscribe(channels => {
      this.channels.set(channels);
      if (channels.length > 0 && !this.activeChannel()) {
        this.activeChannel.set(channels[0]);
      }
    });

    this.userService.getAllUsers().subscribe(users => this.users.set(users));
  }

  private watchUserStatuses(): void {
    const sub = this.wsService.watchUsers().subscribe(event => {
      if (event.type === 'user:status') {
        const updated = event.data as User;
        this.users.update(list =>
          list.map(u => u.id === updated.id ? updated : u)
        );
      }
    });
    this.subs.add(sub);
  }

  onChannelSelected(channel: Channel): void {
    this.activeChannel.set(channel);
  }

  reloadChannels(): void {
    this.channelService.getChannels().subscribe(channels => {
      this.channels.set(channels);
      const active = this.activeChannel();
      if (active && !channels.find(c => c.id === active.id)) {
        this.activeChannel.set(channels[0] ?? null);
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(v => !v);
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
