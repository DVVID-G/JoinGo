/**
 * Meeting domain model
 */
export interface Meeting {
  id: string;
  hostUid: string;
  createdAt: string;
  expiresAt?: string;
  status?: 'active' | 'closed';
  maxParticipants?: number;
  metadata?: Record<string, any>;
}
