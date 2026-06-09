import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../core/services/message.service';

/**
 * Composant menu d'export des messages d'un canal.
 *
 * Déclenche le téléchargement via l'API Blob Angular :
 *  1. Appel REST → Blob (fichier binaire)
 *  2. Création d'un URL objet temporaire
 *  3. Clic programmatique sur un lien <a> pour le téléchargement
 *  4. Révocation de l'URL pour libérer la mémoire
 *
 * Formats supportés : JSON, CSV, XML
 */
@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="export-menu">
      <button class="export-toggle" (click)="isOpen.set(!isOpen())">
        ⬇ Export
      </button>
      @if (isOpen()) {
        <div class="export-dropdown">
          <button (click)="export('json')">JSON</button>
          <button (click)="export('csv')">CSV</button>
          <button (click)="export('xml')">XML</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .export-menu { position: relative; }

    .export-toggle {
      background: rgba(255,255,255,0.05);
      border: 1px solid #1e3a5f;
      border-radius: 6px;
      color: #8892b0;
      cursor: pointer;
      font-size: 0.82rem;
      padding: 0.4rem 0.75rem;
      transition: background 0.15s;

      &:hover { background: rgba(255,255,255,0.1); color: #ccd6f6; }
    }

    .export-dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      background: #16213e;
      border: 1px solid #1e3a5f;
      border-radius: 8px;
      overflow: hidden;
      z-index: 100;
      min-width: 100px;

      button {
        display: block;
        background: none;
        border: none;
        color: #ccd6f6;
        cursor: pointer;
        font-size: 0.85rem;
        padding: 0.6rem 1rem;
        text-align: left;
        width: 100%;

        &:hover { background: rgba(233, 69, 96, 0.15); color: #e94560; }
      }
    }
  `]
})
export class ExportMenuComponent {
  @Input() channelId!: string;
  isOpen = signal(false);

  constructor(private messageService: MessageService) {}

  export(format: 'json' | 'csv' | 'xml'): void {
    this.isOpen.set(false);
    const obs = format === 'json' ? this.messageService.exportJson(this.channelId)
              : format === 'csv'  ? this.messageService.exportCsv(this.channelId)
              :                     this.messageService.exportXml(this.channelId);

    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml'
    };

    obs.subscribe(blob => {
      const url = URL.createObjectURL(
        new Blob([blob], { type: mimeTypes[format] })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `messages-${this.channelId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
