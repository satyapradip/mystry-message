import { z } from 'zod';

/**
 * verifySchema - Validates the email verification code
 * 
 * When a user signs up, they receive a 6-digit code via email.
 * This schema ensures the code they enter:
 * - Is exactly 6 characters long (no more, no less)
 * - Is a string (even though it looks like a number, we treat it as text)
 * 
 * Usage example:
 *   verifySchema.parse({ code: '123456' })  // ✅ Valid
 *   verifySchema.parse({ code: '12345' })   // ❌ Too short
 *   verifySchema.parse({ code: '1234567' }) // ❌ Too long
 */
export const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});