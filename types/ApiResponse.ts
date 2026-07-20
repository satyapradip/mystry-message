// ============================================
// ApiResponse Type Definition
// ============================================
// This defines the "shape" of the response our API will send back to the frontend.
// Every API endpoint will return data in this format so the frontend always knows
// what to expect.
//
// '?' means the field is OPTIONAL - it may or may not be present.
// This way we can reuse the same type for different kinds of responses.

import { Message } from "@/models/User";

export interface ApiResponse {
  success: boolean;              // true = operation worked, false = something went wrong
  message: string;               // A human-readable message (e.g., "User registered")
  isAcceptingMessages?: boolean; // (Optional) Used when checking message acceptance status
  messages?: Array<Message>;     // (Optional) Used when fetching list of messages
}
