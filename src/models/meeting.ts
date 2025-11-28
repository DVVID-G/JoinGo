/**
 * Meeting domain model
 */
export interface Meeting {
  id: string;
  hostUid: string;
  createdAt: string;
  expiresAt?: string;
  // status: 'active' means visible/usable; 'inactive' is soft-deleted; 'closed' may represent ended meetings
  status?: 'active' | 'inactive' | 'closed';
  maxParticipants?: number;
  metadata?: Record<string, any>;
}
