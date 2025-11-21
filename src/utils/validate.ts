import { ZodSchema } from 'zod';
import { Errors } from './httpErrors';

/** Validates data against a Zod schema, throws 400 error if invalid */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Errors.badRequest(result.error.errors.map(e => e.message).join('; '));
  }
  return result.data;
}
