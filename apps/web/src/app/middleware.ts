import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware runs on the edge — it cannot call the API to verify tokens.
 * It only checks for the presence of the refresh token cookie to determine
 * if a user *might* be authenticated. Full auth validation happens:
 *   1. In the auth-provider on mount (silent refresh)
 *   2. In each API call (Bearer token verification)
 *   3. In admin/dashboard layouts (role check after token decoded)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require any authentication
  const authRequired = [
    '/dashboard',
    '/admin',
    '/my-tickets',
    '/profile',
    '/checkout',
  ];

  const isAuthRequired = authRequired.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isAuthRequired) {
    return NextResponse.next();
  }

  // Check for refresh token cookie as a proxy for "logged in"
  // The actual token validation happens client-side in auth-provider
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (!hasRefreshToken) {
    const loginUrl = new URL('/sign-in', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/my-tickets',
    '/profile',
    '/checkout/:path*',
  ],
};