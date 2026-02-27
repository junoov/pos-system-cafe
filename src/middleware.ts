import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthenticated = Boolean(session);

  if (!isAuthenticated && !isLoginPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (sessionToken) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (local images in public directory)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
};
