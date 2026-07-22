import "next-auth";
import "next-auth/jwt";

/**
 * Type Augmentation for NextAuth
 * 
 * By default, NextAuth's User, Session, and JWT types only have basic fields
 * (name, email, image). We need to add our custom fields so TypeScript
 * doesn't throw errors when we access them in callbacks and on the client.
 */

declare module "next-auth" {
  /**
   * User — represents the user object returned from authorize()
   * We add _id, isVerified, isAcceptingMessages, username
   */
  interface User {
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
    username?: string;
  }

  /**
   * Session — represents what the client sees via useSession()
   * We merge our custom fields with the default session user type
   */
  interface Session {
    user: {
      _id?: string;
      isVerified?: boolean;
      isAcceptingMessages?: boolean;
      username?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT — represents the token stored in the JWT cookie
   * We store our custom fields here so they persist across requests
   */
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
    username?: string;
  }
}