import { z } from 'zod';

export const syncUserSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['host', 'participant']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  age: z.number().int().positive().optional(),
  // Optional phone number. Accepts either E.164 (+123...) or plain digits (7-15 digits).
  phoneNumber: z.string().regex(/^(?:\+\d{7,15}|\d{7,15})$/, 'Phone number must be E.164 (e.g. +34123456789) or digits only (7-15 chars)').optional()
});

export const updateUserSchema = syncUserSchema;

export type SyncUserInput = z.infer<typeof syncUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
