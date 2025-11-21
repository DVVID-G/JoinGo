import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  age: z.number().int().positive().optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

export const forgotSchema = z.object({ email: z.string().email() });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;

export const changeEmailSchema = z.object({
  email: z.string().email()
});

export const changePasswordSchema = z.object({
  password: z.string().min(6)
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const providerSyncSchema = z.object({
  provider: z.string().optional(),
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().optional(),
  phoneNumber: z.string().optional(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  email: z.string().email().optional()
});

export type ProviderSyncInput = z.infer<typeof providerSyncSchema>;

export const oauthSchema = z.object({
  provider: z.enum(['google', 'facebook']),
  code: z.string().min(10),
  redirectUri: z.string().url().optional()
});

export type OAuthInput = z.infer<typeof oauthSchema>;
