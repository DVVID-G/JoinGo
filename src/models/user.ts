/** User domain model */
export interface User {
  uid: string;
  // Basic profile
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  locale?: string;

  // Provider metadata
  provider?: string; // e.g. 'google.com', 'facebook.com'
  providerUid?: string; // UID provided by provider
  providerId?: string; // provider-specific id

  // Product fields
  role?: 'host' | 'participant';
  profileCompleted?: boolean;
  status?: 'active' | 'deleted';

  // Audit
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
