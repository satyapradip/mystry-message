// ============================================
// Sign-Up API Route (app/api/sign-up/route.ts)
// ============================================
// This is a Next.js API route that handles user registration.
// When a user fills out the sign-up form on the frontend, their data
// is sent here as a POST request.
//
// Flow:
// 1. Receive username, email, password from the form
// 2. Check if the username is already taken (by a verified user)
// 3. Check if the email is already registered
// 4. If new user → create account and send verification email
// 5. If existing but unverified → update their info and resend verification email

import dbConnect from '@/lib/dbConnect';                 // Database connection helper
import UserModel from '@/models/User';                    // User model (talks to MongoDB)
import bcrypt from 'bcryptjs';                            // Library for hashing passwords
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail'; // Email sender

/**
 * POST /api/sign-up
 * Handles new user registration
 */
export async function POST(request: Request) {
  // Step 1: Connect to the database
  await dbConnect();

  try {
    // Step 2: Extract form data from the request body (sent as JSON)
    // 'await request.json()' reads the JSON body of the HTTP request
    const { username, email, password } = await request.json();

    // Step 3: Check if the username is already taken by a verified user
    // We use 'findOne' to search MongoDB for a matching document
    const existingVerifiedUserByUsername = await UserModel.findOne({
      username,
      isVerified: true,  // Only care if the user has already verified their email
    });

    // If a verified user with this username exists, reject the registration
    if (existingVerifiedUserByUsername) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 400 }  // 400 = "Bad Request" (client error)
      );
    }

    // Step 4: Check if this email is already in our database
    const existingUserByEmail = await UserModel.findOne({ email });

    // Step 5: Generate a random 6-digit verification code
    // Math.random() gives a number between 0 and 1
    // 100000 + random * 900000 gives a number between 100000 and 999999
    // .toString() converts it to a string (so "123456" instead of 123456)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      // --- CASE 1: User with this email already exists ---
      
      if (existingUserByEmail.isVerified) {
        // If they're already verified, they can't register again
        return Response.json(
          {
            success: false,
            message: 'User already exists with this email',
          },
          { status: 400 }
        );
      } else {
        // If they exist but haven't verified yet, update their info
        // This allows someone who didn't complete verification to try again
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password (10 = salt rounds)
        existingUserByEmail.password = hashedPassword;           // Update password
        existingUserByEmail.verifyCode = verifyCode;             // Set new verification code
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // Code expires in 1 hour
        await existingUserByEmail.save();                        // Save changes to database
      }
    } else {
      // --- CASE 2: Completely new user ---
      
      // Hash the password before storing it (never store plain text passwords!)
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Set expiry date to 1 hour from now
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      // Create a new user document in MongoDB
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,       // Store the HASHED password, not the original
        verifyCode,                     // The 6-digit code for email verification
        verifyCodeExpiry: expiryDate,   // When the code expires
        isVerified: false,              // Not verified yet
        isAcceptingMessages: true,      // Start with accepting messages ON by default
        messages: [],                   // No messages yet (empty array)
      });

      // Save the new user to the database
      await newUser.save();
    }

    // Step 6: Send the verification email to the user
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    // If the email failed to send, let the user know
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,  // Contains the error message
        },
        { status: 500 }  // 500 = "Internal Server Error" (server-side problem)
      );
    }

    // Step 7: Everything worked! Send a success response
    return Response.json(
      {
        success: true,
        message: 'User registered successfully. Please verify your account.',
      },
      { status: 201 }  // 201 = "Created" (a new resource was created)
    );
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error registering user:', error);
    return Response.json(
      {
        success: false,
        message: 'Error registering user',
      },
      { status: 500 }
    );
  }
}
