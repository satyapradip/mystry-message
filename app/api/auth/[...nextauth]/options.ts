import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<string, string> | undefined
      ): Promise<User | null> {
        // --- VALIDATION: Ensure both fields are provided ---
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Username and Password are required");
        }

        // --- CONNECT TO DATABASE ---
        await dbConnect();
        try {
          // --- FIND USER by email OR username (whichever the user typed) ---
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });

          // --- CHECK: Does user exist? ---
          if (!user) {
            throw new Error("User not found with this email or username");
          }

          // --- CHECK: Is email verified? ---
          if (!user.isVerified) {
            throw new Error("Please verify your account before login");
          }

          // --- CHECK: Is password correct? (bcrypt.compare hashes the input and compares) ---
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (isPasswordCorrect) {
            // ✅ Success — return user object (plain object, not Mongoose doc, to avoid type conflicts)
            return {
              _id: user._id.toString(),
              email: user.email,
              username: user.username,
              isVerified: user.isVerified,
              isAcceptingMessages: user.isAcceptingMessages,
            } as User;
          } else {
            throw new Error("Incorrect Password");
          }
        } catch (err: unknown) {
          // Re-throw the error message cleanly (don't double-wrap the Error object)
          if (err instanceof Error) {
            throw new Error(err.message);
          }
          throw new Error("An unexpected error occurred");
        }
      },
    }),
  ],
  callbacks: {
    /**
     * JWT Callback — runs when a JWT token is created or updated
     * 
     * We attach custom user data to the token so it's available in the session
     * 'user' only exists on FIRST login; subsequent refreshes only have 'token'
     */
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token; // ← Must return token!
    },
    /**
     * Session Callback — runs every time the session is accessed
     * 
     * We copy the custom data from the token into the session object
     * so it's available on the client via useSession()
     */
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in", // Custom sign-in page route
  },
  session: {
    strategy: "jwt", // Use JWT strategy (no database sessions)
  },
  secret: process.env.NEXTAUTH_SECRET, // Secret for signing JWT tokens
};