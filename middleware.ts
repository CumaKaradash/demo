import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  // Check if the route is an admin route
  const isAdminRoute = pathname.startsWith('/admin-paneli');

  // Check if user is authenticated
  const isAuthenticated = !!req.auth;

  // If accessing admin routes without authentication, redirect to login
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    // Add the current path as a callback URL
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login page, redirect to admin panel
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin-paneli', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
