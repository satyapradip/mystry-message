import { z } from 'zod';

/**
 * usernameValidation - A reusable validation rule for usernames
 * 
 * zod is a validation library that lets us define rules for data.
 * Think of it like creating a "rule book" that data must follow.
 * 
 * Rules:
 * - Must be a string
 * - Minimum 2 characters
 * - Maximum 20 characters
 * - Only letters (a-z, A-Z), numbers (0-9), and underscores (_) allowed
 */
export const usernameValidation = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(20, 'Username must be no more than 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username must not contain special characters'
  );

/**
 * signUpSchema - Validates the sign-up form data
 * 
 * This schema checks that:
 * - username follows the rules defined above
 * - email is in a valid email format
 * - password is at least 6 characters long
 * 
 * Usage: signUpSchema.parse({ username: 'john', email: 'john@test.com', password: '123456' })
 * If validation fails, it throws an error with details about what went wrong.
 */
export const signUpSchema = z.object({
  username: usernameValidation,
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
});