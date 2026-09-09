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

    // Redirect logged-in users away from login pages only when they are fully set up.
    // Users with an incomplete profile can still visit /login (e.g. to switch accounts
    // or re-authenticate). They will be sent to /onboarding AFTER sign-in via the
    // auth callback → jwt profileCompleted=false → the protected route guards above.
    if (pathname === '/login' || pathname === '/admin/login') {
      if (profileCompleted) {
        // Already fully onboarded — send them straight to the portal.
        const dest = isStaff ? '/staff' : '/dashboard';
        return NextResponse.redirect(new URL(dest, req.url));
      }
      // profileCompleted=false → let the login page render so the user can sign in.
      // After sign-in the jwt callback will set profileCompleted, and subsequent
      // navigation to /staff or /dashboard will trigger the onboarding guard above.
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
