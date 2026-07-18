import { z } from 'zod';

/**
 * AcceptMessageSchema - Validates the "accept messages" toggle setting
 * 
 * This schema is used when a user wants to turn ON or OFF the ability
 * to receive anonymous messages.
 * 
 * It only has one field:
 * - acceptMessages: a boolean (true = accept messages, false = don't accept)
 * 
 * Usage example:
 *   AcceptMessageSchema.parse({ acceptMessages: true })   // ✅ Valid
 *   AcceptMessageSchema.parse({ acceptMessages: false })  // ✅ Valid
 *   AcceptMessageSchema.parse({ acceptMessages: 'yes' })  // ❌ Invalid (must be true/false)
 */
export const AcceptMessageSchema = z.object({
  acceptMessages: z.boolean(),
});