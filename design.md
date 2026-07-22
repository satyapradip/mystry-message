# 🏗️ Mystry Message — Project Design Document

> **Project:** Anonymous messaging platform  
> **Stack:** Next.js 16 + TypeScript + MongoDB (Mongoose) + NextAuth.js + Resend  
> **Purpose:** Users can sign up, verify email, and receive anonymous messages

---

## 🎯 Core Concept

Users create a profile and share a link. Anyone with the link can send them an **anonymous message** (the sender's identity is hidden). The recipient can view and manage these messages in their dashboard.

---

## 🗂️ Project Structure

```
mystry-message/
├── app/                          ← Next.js App Router
│   ├── page.tsx                  ← Home page (landing)
│   ├── layout.tsx                ← Root layout (fonts, globals)
│   ├── globals.css               ← Global Tailwind styles
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/    ← NextAuth catch-all route
│   │   │       ├── route.ts      → GET/POST handlers
│   │   │       └── options.ts    → Auth config (providers, callbacks)
│   │   └── sign-up/
│   │       └── route.ts          → POST /api/sign-up (registration)
│   │   (future):
│   │   ├── verify-code/          → Email verification
│   │   ├── accept-message/       → Toggle message acceptance
│   │   └── send-message/         → Submit anonymous message
│   ├── (future):
│   │   ├── sign-in/page.tsx      → Login form
│   │   ├── sign-up/page.tsx      → Registration form
│   │   ├── dashboard/page.tsx    → Protected dashboard
│   │   └── u/[username]/page.tsx → Public profile (send msg)
│   └── Provider.tsx              → SessionProvider wrapper
│
├── emails/
│   └── VerificationEmail.tsx     → Email template (React Email)
│
├── helpers/
│   └── sendVerificationEmail.ts  → Helper to send emails via Resend
│
├── lib/
│   ├── dbConnect.ts              → MongoDB connection singleton
│   └── resend.ts                 → Resend API client
│
├── models/
│   └── User.ts                   → Mongoose models (User + Message)
│
├── schemas/
│   ├── signUpSchema.ts           → Zod: Sign-up form validation
│   ├── signInSchema.ts           → Zod: Sign-in form validation
│   ├── verifySchema.ts           → Zod: Verification code validation
│   ├── acceptMessageSchema.ts    → Zod: Toggle message acceptance
│   └── messageSchema.ts          → Zod: Send message validation
│
├── types/
│   ├── ApiResponse.ts            → Generic API response type
│   └── next-auth.d.ts            → NextAuth type augmentation
│
├── middleware.ts                  → Route protection
├── learning.md                   → Learning journal (bugs, fixes, concepts)
├── design.md                     → This file — project design
├── .env                          → Environment variables (local)
├── .env.sample                   → Environment template (git)
├── tsconfig.json                 → TypeScript configuration
├── next.config.ts                → Next.js configuration
└── package.json                  → Dependencies & scripts
```

---

## 🔐 Authentication Architecture

### Auth Flow Diagram

```
┌──────────┐     POST /api/auth/callback/credentials     ┌────────────────┐
│          │ ──────────────────────────────────────────→  │                │
│  Sign-In │                                              │  NextAuth.js   │
│   Form   │ ←── Redirect to /dashboard or error ──────  │  (credentials) │
│          │                                              │                │
└──────────┘                                              └───────┬────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  authorize()     │
                                                         │  ─────────────   │
                                                         │  1. Find user    │
                                                         │  2. Check verify │
                                                         │  3. bcrypt check │
                                                         │  4. Return user  │
                                                         └──────────────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  jwt() callback  │
                                                         │  ─────────────   │
                                                         │  Token gets:     │
                                                         │  _id, username,  │
                                                         │  isVerified,     │
                                                         │  isAcceptingMsgs │
                                                         └──────────────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  session() cb    │
                                                         │  ─────────────   │
                                                         │  Session gets:   │
                                                         │  same fields     │
                                                         └──────────────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  Client via      │
                                                         │  useSession()    │
                                                         └──────────────────┘
```

### Session Management Strategy

| Setting | Value | Why |
|---------|-------|-----|
| `strategy` | `"jwt"` | No database sessions needed. Token stored in HTTP-only cookie |
| `secret` | `NEXTAUTH_SECRET` | Signs the JWT so it can't be tampered with |
| Cookie name | `next-auth.session-token` | Default — auto-managed by NextAuth |

### Middleware Protection Rules

```
Request comes in → config.matcher checks the path
                         │
                         ▼
              ┌─────────────────────┐
              │ Does path match?    │
              │ e.g. /dashboard,    │── No ──→ NextResponse.next() (allow)
              │ /sign-in, /         │
              └─────────┬───────────┘
                        │ Yes
                        ▼
              ┌─────────────────────┐
              │ getToken({ req })   │
              │ reads JWT cookie    │
              └─────────┬───────────┘
                        │
              ┌─────────┴──────────┐
              │ token exists?      │
              └─────────┬──────────┘
                        │
           ┌────────────┼────────────┐
           │ Yes        │ No         │
           ▼            ▼            ▼
   ┌────────────┐  ┌────────────┐  ┌────────┐
   │ On sign-in,│  │ On         │  │ Allow  │
   │ sign-up,   │  │ dashboard  │  │ through│
   │ verify, /  │  │ redirect   │  └────────┘
   │ redirect   │  │ to /sign-in│
   │ to /dashbd │  └────────────┘
   └────────────┘
```

---

## 💾 Database Schema

### User Document (MongoDB)

```json
{
  "_id": "ObjectId",
  "username": "string (unique)",
  "email": "string (unique)",
  "password": "string (bcrypt hashed)",
  "verifyCode": "string (6-digit)",
  "verifyCodeExpiry": "Date (1 hour from creation)",
  "isVerified": "boolean (default: false)",
  "isAcceptingMessages": "boolean (default: true)",
  "messages": [
    {
      "content": "string",
      "createdAt": "Date"
    }
  ]
}
```

### Why Embedded Messages?
- Messages are always accessed WITH the user (never standalone)
- No need for a separate `messages` collection or joins
- MongoDB documents can be up to 16MB — plenty for messages
- Trade-off: querying/filtering messages is less flexible

---

## 📡 API Routes

| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| `POST` | `/api/auth/[...nextauth]` | NextAuth (sign in, session, etc.) | No |
| `GET` | `/api/auth/[...nextauth]` | NextAuth (get session) | No |
| `POST` | `/api/sign-up` | Register new user | No |
| `POST` | `/api/verify-code` | Verify email with code | Yes? |
| `POST` | `/api/accept-message` | Toggle accept messages | Yes |
| `POST` | `/api/send-message` | Send anonymous message | No |
| `GET` | `/api/get-messages` | Get user's messages | Yes |

---

## 🔧 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.x | React framework |
| `next-auth` | ^4.24 | Authentication library |
| `mongoose` | ^9.x | MongoDB ODM |
| `bcryptjs` | ^3.x | Password hashing |
| `resend` | ^6.x | Email delivery |
| `zod` | ^4.x | Form/input validation |
| `react-email` | (via jsx-email) | Email template components |
| `tailwindcss` | ^4.x | Utility CSS framework |

---

## ✅ Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth library | NextAuth.js | Industry standard, built for Next.js |
| Auth strategy | JWT (no DB sessions) | Simpler, no extra DB queries |
| Login method | Email OR Username | User convenience |
| Email service | Resend | Simple API, React Email support |
| Validation | Zod schemas | TypeScript-first, composable |
| Password storage | bcrypt (10 rounds) | Industry standard, secure |
| Messages storage | Embedded in User doc | Simpler queries for this use case |
| CSS | Tailwind CSS | Rapid development, consistent design |

---

## 🚀 Future Enhancements

1. **OAuth providers** (Google, GitHub) — add to NextAuth providers array
2. **Rate limiting** — prevent spam / brute force attacks
3. **Message reporting** — flag inappropriate messages
4. **User settings page** — change password, delete account
5. **Message pagination** — load more messages as user scrolls
6. **Email notifications** — notify user when they get a new message
7. **Dark mode toggle** — persist theme preference
8. **i18n** — multi-language support