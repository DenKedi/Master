import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth(req => {
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!req.auth;

  // Public routes: landing, login, register, API auth, public API endpoints
  const publicPaths = ['/', '/login', '/register'];
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cards/render/') ||
    // POST /api/users is the public registration endpoint
    // (GET /api/users is admin-only but guards itself in the route handler)
    pathname === '/api/users';

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin guard
  if (pathname.startsWith('/admin')) {
    const role = (req.auth?.user as any)?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/hub', req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
