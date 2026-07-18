import { z } from 'zod';

/**
 * messageSchema - Validates the content of an anonymous message
 * 
 * This schema ensures that messages:
 * - Are at least 10 characters long (so people can't send empty or very short messages)
 * - Are no longer than 300 characters (keeps messages concise)
 * 
 * Usage example:
 *   messageSchema.parse({ content: 'Hello, this is my message!' })
 */
export const messageSchema = z.object({
  content: z
    .string()
    .min(10, { message: 'Content must be at least 10 characters.' })
    .max(300, { message: 'Content must not be longer than 300 characters.' }),
});