import { z } from 'zod';

/**
 * signInSchema - Validates the sign-in (login) form data
 * 
 * This schema checks that:
 * - identifier: This is what the user uses to log in (could be their email OR username)
 *   Note: It's just a string with no extra validation because we accept both email and username
 * - password: The user's password (just needs to be a string)
 * 
 * Why 'identifier' instead of 'email'?
 * Because users might log in with either their email OR their username,
 * so we use a generic term "identifier" to accept both.
 */
export const signInSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});