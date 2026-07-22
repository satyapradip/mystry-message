// ============================================
// Middleware — Route Protection (NextAuth)
// ============================================
//
// WHAT IS MIDDLEWARE?
// Middleware in Next.js runs BEFORE a request reaches your page.
// It acts like a security guard at the door:
//   1. Intercept every incoming request
//   2. Check if user is authenticated (has a valid JWT token)
//   3. Decide: allow them through OR redirect them somewhere else
//
// WHY USE IT?
// Without middleware: user visits /dashboard → page loads → React checks session
//   → flash of unprotected content → redirect to login (ugly & insecure)
// With middleware: user visits /dashboard → middleware checks token → redirect to login
//   → protected content never loads (clean & secure)
//
// HOW IT WORKS HERE:
// - getToken() reads the JWT from the request cookie
// - If token exists → user IS logged in
// - If token is null → user is NOT logged in
//
// RULES WE ENFORCE:
//   1. Logged-in users trying to visit /sign-in, /sign-up, /verify, or / → redirect to /dashboard
//   2. Logged-out users trying to visit /dashboard → redirect to /sign-in
//   3. Everything else → let through

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  // These are the routes this middleware runs on (regex pattern)
  // :path* means "and any sub-path"
  matcher: [
    "/dashboard/:path*", // /dashboard, /dashboard/settings, etc.
    "/sign-in",
    "/sign-up",
    "/",
    "/verify/:path*", // /verify/abc123, etc.
  ],
};

export async function middleware(request: NextRequest) {
  // Read the JWT token from the request cookie
  // getToken() automatically finds the cookie and decrypts it
  const token = await getToken({ req: request });
  const url = request.nextUrl; // Gives us access to the requested URL

  // --- RULE 1: Redirect authenticated users AWAY from auth pages ---
  // If user IS logged in (token exists) AND trying to access...
  //   /sign-in, /sign-up, /verify/*, or home page (/)
  // ...send them to /dashboard instead
  if (
    token &&
    (url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname.startsWith("/verify") ||
      url.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- RULE 2: Redirect unauthenticated users TO auth pages ---
  // If user is NOT logged in (no token) AND trying to access /dashboard
  // ...send them to /sign-in
  if (!token && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // --- RULE 3: Allow everything else through ---
  // If none of the above rules matched, let the request proceed normally
  return NextResponse.next();
}