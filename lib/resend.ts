// ============================================
// Resend Email Client Setup
// ============================================
// Resend is a service that lets us send emails from our app.
// We create one Resend client here and export it so other files can use it.
// The API key is stored in the .env file for security (never hardcode it!).

import { Resend } from 'resend';

// Create a Resend client instance using the API key from environment variables
// process.env.RESSEND_API_KEY reads the value we set in our .env file
export const resend = new Resend(process.env.RESSEND_API_KEY);

