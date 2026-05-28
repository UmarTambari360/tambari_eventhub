import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected route prefixes.
 * The middleware does not verify the JWT — that is the API's job.
 * It only checks for the presence of the refresh_token cookie as a
 * proxy for "has an active session". The silent refresh in AuthProvider
 * handles actual token validity on mount.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/my-tickets',
  '/profile',
  '/checkout',
];

const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Check for refresh token cookie as a session indicator
  const hasSession = request.cookies.has('refresh_token');

  // Redirect unauthenticated users trying to access protected routes
  if (isProtected && !hasSession) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};