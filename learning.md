# 📚 Mystry Message — Learning Journal

> **Project:** Anonymous messaging platform  
> **Built with:** Next.js 16 + TypeScript + MongoDB + NextAuth.js  
> **Goal:** Learn full-stack authentication (Credentials-based auth with NextAuth)

---

## 📖 Table of Contents

1. [Project Setup (Next.js + TypeScript + MongoDB)](#1-project-setup)
2. [MongoDB Models with Mongoose](#2-mongodb-models-with-mongoose)
3. [API Routes in Next.js App Router](#3-api-routes-in-nextjs-app-router)
4. [Password Hashing with bcrypt](#4-password-hashing-with-bcrypt)
5. [NextAuth.js — The Auth Library](#5-nextauthjs--the-auth-library)
6. [Credentials Provider (Email/Password Login)](#6-credentials-provider)
7. [JWT & Session Callbacks — Passing Custom Data](#7-jwt--session-callbacks)
8. [Type Augmentation — Teaching TypeScript About New Fields](#8-type-augmentation)
9. [Middleware — Route Protection](#9-middleware--route-protection)
10. [Verification Emails with Resend](#10-verification-emails-with-resend)
11. [Common Mistakes & Debugging Tips](#11-common-mistakes--debugging-tips)

---

## 1. Project Setup

### Key Files Created:
```
.env                          → Environment variables (MONGODB_URI, etc.)
lib/dbConnect.ts              → MongoDB connection helper
models/User.ts                → User + Message Mongoose models
types/next-auth.d.ts          → TypeScript type augmentation for NextAuth
app/api/auth/[...nextauth]/  → NextAuth API route (the main auth handler)
  ├── route.ts                → Exports GET and POST handlers
  └── options.ts              → Auth configuration (providers, callbacks)
middleware.ts                 → Route protection (runs before pages load)
```

### What I Learned:
- **Next.js App Router** uses file-based routing. `app/api/auth/[...nextauth]/` becomes `GET /api/auth/[...nextauth]` — the `[...nextauth]` is a catch-all route that handles all NextAuth endpoints (`signin`, `callback`, `session`, etc.)
- **NextAuth v4** is imported as `next-auth`. The credentials provider is at `next-auth/providers/credentials`.

### Critical Mistake I Made:
> I originally placed my auth route at `app/api/sign-up/auth/[...nextauth]/` instead of `app/api/auth/[...nextauth]/`.  
> This meant NextAuth's default handlers (`signIn()`, `signOut()`, `useSession()`) couldn't find the API. **Always use `app/api/auth/[...nextauth]`** — NextAuth expects this exact path.

---

## 2. MongoDB Models with Mongoose

### File: `models/User.ts`

```typescript
export interface Message extends Document {
  content: string;
  createdAt: Date;
}

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  verifyCode: string;
  verifyCodeExpiry: Date;
  isVerified: boolean;
  isAcceptingMessages: boolean;
  messages: Message[];
}
```

### What I Learned:
- **`extends Document`** — Makes the TypeScript interface represent a MongoDB document (includes `_id`, `save()`, etc.)
- **Embedded documents** — Messages are stored inside the User document (not a separate collection) using `[MessageSchema]`. Good when data is always accessed together.
- **`mongoose.models.User || mongoose.model<User>()`** — Prevents "OverwriteModel" error when hot-reloading in development.
- **Mongoose `_id` is `ObjectId`**, not `string`. When returning a user from next-auth's authorize(), you must convert: `user._id.toString()`.

---

## 3. API Routes in Next.js App Router

### File: `app/api/sign-up/route.ts`

```typescript
export async function POST(request: Request) {
  const { username, email, password } = await request.json();
  // ... logic ...
  return Response.json({ success: true, message: "..." }, { status: 201 });
}
```

### What I Learned:
- **Route handlers** are just functions named after HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
- **`request.json()`** reads the JSON body sent from the frontend
- **`Response.json()`** is the built-in way to return JSON responses (no need for `NextResponse`)
- **Status codes matter:** 200 = OK, 201 = Created, 400 = Bad Request, 500 = Server Error
- **No `export default`** — each function is a named export

### Sign-Up Flow:
```
User submits form → POST /api/sign-up → 
  1. Check if username taken (verified user) 
  2. Check if email exists
  3. Generate 6-digit verification code
  4. Hash password with bcrypt (10 salt rounds)
  5. Save user to MongoDB (isVerified: false)
  6. Send verification email via Resend
  7. Return success/error response
```

---

## 4. Password Hashing with bcrypt

### What I Learned:
```typescript
const hashedPassword = await bcrypt.hash(password, 10); // Hash
const isCorrect = await bcrypt.compare(inputPassword, storedHash); // Compare
```

- **NEVER store plain text passwords** — Always hash before saving
- **Salt rounds (10)** — Higher = more secure but slower. 10-12 is standard
- **`bcrypt.compare()`** — Hashes the input and compares with stored hash. Returns boolean
- **My bug:** I forgot to capture the return value of `bcrypt.compare()` with `const isPasswordCorrect = await bcrypt.compare(...)`

---

## 5. NextAuth.js — The Auth Library

### File: `app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from "next-auth";
import { authOptions } from "./options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### What I Learned:
- **NextAuth is BOTH a GET and POST handler** — sessions are fetched via GET, credentials are submitted via POST, sign-in/sign-out are handled internally
- **`authOptions`** contains all configuration: providers, callbacks, pages, session strategy
- The `[...nextauth]` catch-all catches paths like:
  - `/api/auth/signin` → renders built-in sign-in page
  - `/api/auth/callback/credentials` → handles credential submission
  - `/api/auth/session` → returns session JSON
  - `/api/auth/signout` → handles sign-out

---

## 6. Credentials Provider

### File: `app/api/auth/[...nextauth]/options.ts` — `authorize()` function

```typescript
async authorize(credentials: Record<string, string> | undefined): Promise<User | null> {
  // 1. Validate input
  // 2. Connect to DB
  // 3. Find user by email OR username
  // 4. Check if user exists
  // 5. Check if user is verified
  // 6. Check password with bcrypt.compare()
  // 7. Return user object (success) OR throw error (failure)
}
```

### Critical Rules:
- **`authorize()` MUST return an object** matching the `User` type to indicate success
- **Throw an Error** to indicate failure (NextAuth catches it)
- **Return `null`** also indicates failure, but throwing gives you a better error message
- **The returned object becomes the `user` parameter in the `jwt` callback**

### My Bugs:
1. ❌ Forgot `const user = await UserModel.findOne(...)` — variable was never assigned
2. ❌ Forgot `const isPasswordCorrect = await bcrypt.compare(...)` — never captured result
3. ❌ Logic was inverted: returned user when password was WRONG, threw error when CORRECT
4. ❌ Credentials field name `Email` didn't match reference `credentials.identifier`

---

## 7. JWT & Session Callbacks

### JWT Callback — Runs on login and token refresh:
```typescript
async jwt({ token, user }) {
  if (user) {
    token._id = user._id?.toString();
    token.isVerified = user.isVerified;
    token.username = user.username;
  }
  return token; // ← MUST return token!
}
```

### Session Callback — Runs every time session is accessed:
```typescript
async session({ session, token }) {
  if (token) {
    session.user._id = token._id;
    session.user.isVerified = token.isVerified;
    session.user.username = token.username;
  }
  return session;
}
```

### Data Flow:
```
Login → authorize() returns user object
     → jwt({ token, user }) stores custom fields in token
     → session({ session, token }) copies token fields to session
     → Client gets session.user._id, .username, etc. via useSession()
```

### My Bug:
- ❌ In `jwt` callback: `token.isVerified` without assignment — just reads the value, does nothing
- ❌ Missing `return token` — the token was created but never returned, effectively lost
- ✅ Fixed: `token.isVerified = user.isVerified` + `return token`

---

## 8. Type Augmentation

### File: `types/next-auth.d.ts`

```typescript
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User { _id?: string; isVerified?: boolean; username?: string; }
  interface Session {
    user: { _id?: string; isVerified?: boolean; username?: string; } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT { _id?: string; isVerified?: boolean; username?: string; }
}
```

### What I Learned:
- **TypeScript module augmentation** — `declare module "next-auth"` adds new properties to existing types
- **Session's `user` must extend `DefaultSession["user"]`** — otherwise you lose `name`, `email`, and `image`
- **The `&` operator** merges two types together
- **Must import `"next-auth/jwt"`** separately to augment JWT types
- **The `.d.ts` file** is automatically picked up by TypeScript — no need to import it anywhere

### My Bug:
- ❌ I only augmented the `User` interface, not `Session` and `JWT`
- ❌ This caused TS errors: `Property '_id' does not exist on type '{ name?: ... }'`

---

## 9. Middleware — Route Protection

### File: `middleware.ts` (at project root)

```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Rule 1: Logged-in users → redirect away from auth pages
  if (token && (url.pathname.startsWith("/sign-in") || url.pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rule 2: Logged-out users → redirect away from protected pages
  if (!token && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next(); // Allow through
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/", "/verify/:path*"],
};
```

### What I Learned:
- **Middleware runs BEFORE the page loads** — stops unauthenticated requests at the door
- **`getToken()`** reads and decrypts the JWT cookie — no database call needed
- **`config.matcher`** specifies which routes trigger the middleware (performance optimization)
- **Without middleware**, auth checks happen on the client → flash of unprotected content

### My Bug:
- ❌ Original file had `export { default } from 'next-auth/middleware'` AND a custom middleware — conflict!
- ❌ The `next-auth/middleware` export is a pre-built middleware, but you can't combine it with a custom one
- ✅ Fixed: Removed the default export, wrote fully custom middleware

---

## 10. Verification Emails with Resend

### File: `helpers/sendVerificationEmail.ts`

### What I Learned:
- **Resend** is an email API service — you send HTTP requests, they deliver the email
- **Verification codes** are 6-digit random numbers: `Math.floor(100000 + Math.random() * 900000)`
- **Code expiry** — set to 1 hour: `new Date(Date.now() + 3600000)`
- **Sign-up supports "retry"** — if a user started signing up but didn't verify, they can try again with the same email (we update the existing unverified user)

---

## 11. Common Mistakes & Debugging Tips

### 🚨 My Biggest Mistakes:

| # | Mistake | Symptom | Fix |
|---|---------|---------|-----|
| 1 | Wrong folder: `sign-up/auth/[...nextauth]` | NextAuth routes 404 | Move to `api/auth/[...nextauth]` |
| 2 | `findOne()` result not assigned | `user` is undefined → crash | Add `const user = await ...` |
| 3 | `bcrypt.compare()` result not captured | `isPasswordCorrect` is undefined | Add `const isCorrect = await ...` |
| 4 | Inverted login logic | Wrong password logs you in | `if (isCorrect) return user` (not `!isCorrect`) |
| 5 | `token.isVerified` without `=` | `isVerified` never set | Add `token.isVerified = user.isVerified` |
| 6 | JWT callback missing `return token` | Token has no custom data | Add `return token` at end |
| 7 | Only augmented `User`, not `Session`/`JWT` | TS errors in callbacks | Augment all three types |
| 8 | `_id` is ObjectId, not string | Type mismatch | `user._id.toString()` |
| 9 | `session.user` possibly undefined | TS error | Check `if (token)` before accessing |
| 10 | `any` types in authorize | ESLint errors | Use `Record<string, string> \| undefined` |

### 🔍 Debugging Tips:
- **Check TypeScript**: `npx tsc --noEmit` — catches type errors before runtime
- **Check the cookie**: In browser DevTools → Application → Cookies → look for `next-auth.session-token`
- **Test the API directly**: `fetch('/api/auth/session')` in browser console to see session data
- **NextAuth built-in pages**: Visit `/api/auth/signin` to see the default sign-in page (debug mode)
- **Check .env**: Missing `NEXTAUTH_SECRET` or `MONGODB_URI` will cause silent failures

---

## ✅ Auth Status Checklist

- [x] MongoDB models (User + Message)
- [x] Database connection helper
- [x] Sign-up API route (with email verification)
- [x] NextAuth route handler (at correct path!)
- [x] Credentials provider (authorize function)
- [x] JWT and Session callbacks (custom data)
- [x] Type augmentation (User, Session, JWT)
- [x] Middleware for route protection
- [x] Password hashing with bcrypt
- [x] Verification emails with Resend
- [ ] Sign-in page (frontend UI)
- [ ] Sign-up page (frontend UI)
- [ ] SessionProvider in layout
- [ ] Dashboard page (protected route)

---

> **Next steps:** Build the sign-in page with a form that calls `signIn("credentials", { identifier, password })`, create a SessionProvider wrapper in layout, and build the dashboard to test the full auth flow.