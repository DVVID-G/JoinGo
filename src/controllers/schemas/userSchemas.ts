import { z } from 'zod';

export const syncUserSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['host', 'participant']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  age: z.number().int().positive().optional()
});

export const updateUserSchema = syncUserSchema;

export type SyncUserInput = z.infer<typeof syncUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
