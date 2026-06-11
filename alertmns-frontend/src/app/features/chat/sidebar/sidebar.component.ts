import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../core/models/channel.model';
import { User } from '../../../core/models/user.model';
import { ChannelService } from '../../../core/services/channel.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() channels: Channel[] = [];
  @Input() users: User[] = [];
  @Input() activeChannel: Channel | null = null;
  @Input() currentUser: User | null = null;

  @Output() channelSelected   = new EventEmitter<Channel>();
  @Output() logoutRequested   = new EventEmitter<void>();
  @Output() channelsChanged   = new EventEmitter<void>();

  // ── Modale création ──────────────────────────────────────
  showCreate   = signal(false);
  createName   = '';
  createDesc   = '';
  createPriv   = false;
  createError  = '';
  createLoading = false;

  // ── Modale gestion d'un canal ────────────────────────────
  showManage    = signal(false);
  managedChannel: Channel | null = null;
  manageError   = '';
  manageLoading = false;

  constructor(private channelService: ChannelService) {}

  // ── Accesseurs liste ─────────────────────────────────────
  get publicChannels(): Channel[] { return this.channels.filter(c => !c.isPrivate); }
  get privateChannels(): Channel[] { return this.channels.filter(c => c.isPrivate); }
  get onlineUsers(): User[] {
    return this.users.filter(u => u.status === 'ONLINE' || u.status === 'AWAY');
  }

  // ── Permissions ──────────────────────────────────────────
  get isAdmin(): boolean { return this.currentUser?.role === 'ADMIN'; }

  canManage(channel: Channel): boolean {
    return this.isAdmin || channel.createdBy === this.currentUser?.id;
  }

  // ── Membres / non-membres d'un canal ─────────────────────
  membersOf(channel: Channel): User[] {
    return this.users.filter(u => channel.memberIds.includes(u.id));
  }
  nonMembersOf(channel: Channel): User[] {
    return this.users.filter(u => !channel.memberIds.includes(u.id));
  }

  // ── Actions sidebar ──────────────────────────────────────
  selectChannel(channel: Channel): void { this.channelSelected.emit(channel); }
  logout(): void { this.logoutRequested.emit(); }

  statusColor(status: string): string {
    if (status === 'ONLINE') return '#2ecc71';
    if (status === 'AWAY')   return '#f39c12';
    return '#636e72';
  }

  // ── Modale création ──────────────────────────────────────
  openCreate(): void {
    this.createName = '';
    this.createDesc = '';
    this.createPriv = false;
    this.createError = '';
    this.showCreate.set(true);
  }

  closeCreate(): void { this.showCreate.set(false); }

  submitCreate(): void {
    if (!this.createName.trim()) { this.createError = 'Le nom est obligatoire.'; return; }
    this.createLoading = true;
    this.createError = '';
    this.channelService.createChannel(this.createName.trim(), this.createDesc.trim(), this.createPriv)
      .subscribe({
        next: () => { this.createLoading = false; this.showCreate.set(false); this.channelsChanged.emit(); },
        error: err => {
          this.createLoading = false;
          this.createError = err.error?.message || 'Nom déjà utilisé.';
        }
      });
  }

  // ── Modale gestion ───────────────────────────────────────
  openManage(channel: Channel, event: Event): void {
    event.stopPropagation();
    this.managedChannel = channel;
    this.manageError = '';
    this.showManage.set(true);
  }

  closeManage(): void { this.showManage.set(false); this.managedChannel = null; }

  addMember(userId: string): void {
    if (!this.managedChannel) return;
    this.manageLoading = true;
    this.channelService.updateMembers(this.managedChannel.id, 'add', [userId])
      .subscribe({
        next: updated => {
          this.manageLoading = false;
          this.managedChannel = updated;
          this.channelsChanged.emit();
        },
        error: () => { this.manageLoading = false; this.manageError = 'Erreur lors de l\'ajout.'; }
      });
  }

  removeMember(userId: string): void {
    if (!this.managedChannel) return;
    this.manageLoading = true;
    this.channelService.updateMembers(this.managedChannel.id, 'remove', [userId])
      .subscribe({
        next: updated => {
          this.manageLoading = false;
          this.managedChannel = updated;
          this.channelsChanged.emit();
        },
        error: () => { this.manageLoading = false; this.manageError = 'Erreur lors du retrait.'; }
      });
  }

  deleteChannel(): void {
    if (!this.managedChannel || !confirm(`Supprimer le canal #${this.managedChannel.name} ?`)) return;
    this.manageLoading = true;
    this.channelService.deleteChannel(this.managedChannel.id)
      .subscribe({
        next: () => { this.manageLoading = false; this.closeManage(); this.channelsChanged.emit(); },
        error: () => { this.manageLoading = false; this.manageError = 'Suppression refusée.'; }
      });
  }
}
