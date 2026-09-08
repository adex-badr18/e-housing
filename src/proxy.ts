import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const profileCompleted = user?.profileCompleted ?? false;
  const isStaff = user?.role === 'STAFF';

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/auth');

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedIn) {
    // If user's profile is NOT completed
    if (!profileCompleted) {
      // Force redirect any attempt to access dashboard/staff/applications to /onboarding
      if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/staff') ||
        pathname.startsWith('/applications') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/management')
      ) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    } else {
      // If profile IS completed, block access to /onboarding and redirect to dashboard
      if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
        const dest = isStaff ? '/staff' : '/dashboard';
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }

    // Redirect logged-in users away from login pages
    if (pathname === '/login' || pathname === '/admin/login') {
      if (!profileCompleted) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
      const dest = isStaff ? '/staff' : '/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Basic routing restrictions based on Role
    if (pathname.startsWith('/admin') && isStaff) {
      return NextResponse.redirect(new URL('/staff', req.url));
    }

    // Redirect exact hits to legacy pages to unified dashboard
    if (pathname === '/admin' || pathname === '/management' || pathname === '/admin/' || pathname === '/management/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)'],
};
