/** Modèle TypeScript représentant un canal de discussion. */
export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
}
