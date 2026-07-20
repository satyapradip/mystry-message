// ============================================
// sendVerificationEmail - Helper Function
// ============================================
// This function handles the actual work of sending a verification email.
// It uses the Resend client (from lib/resend.ts) and our email template
// (from emails/VerificationEmail.tsx) to send a 6-digit code to the user.
//
// Other parts of the app (like the sign-up API) call this function
// instead of writing the email-sending code themselves. This keeps things organized!

import { resend } from "@/lib/resend";           // Our Resend email client
import VerificationEmail from "../emails/VerificationEmail";  // The email template
import { ApiResponse } from "@/types/ApiResponse";  // The response format we return

/**
 * Sends a verification email to a newly registered user
 * 
 * @param email - The user's email address to send to
 * @param username - The user's name (for personalizing the email)
 * @param verifyCode - The 6-digit verification code
 * @returns ApiResponse - { success: true/false, message: "..." }
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    // Use the Resend client to send the email
    await resend.emails.send({
      from: 'mystrymessage@mail.com',              // Sender's email address
      to: email,                                    // Recipient's email
      subject: 'Mystery Message Verification Code', // Email subject line
      react: VerificationEmail({ username, otp: verifyCode }), // The HTML content (our template)
    });

    // If we get here, the email was sent without throwing an error
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError) {
    // Something went wrong - log the error for debugging
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.' };
  }
}
