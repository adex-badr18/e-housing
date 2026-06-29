import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  
  // Public routes that don't require authentication
  const isPublicRoute = pathname === '/' || 
                        pathname === '/login' || 
                        pathname === '/admin/login' || 
                        pathname === '/register';
  
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  if (isLoggedIn && (pathname === '/login' || pathname === '/admin/login')) {
    // Basic redirect for logged-in users trying to access login pages
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Basic routing restrictions based on Role
  if (isLoggedIn && pathname.startsWith('/admin') && req.auth?.user?.role === 'STAFF') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect exact hits to legacy pages to the unified dashboard
  if (isLoggedIn && (pathname === '/admin' || pathname === '/management' || pathname === '/admin/' || pathname === '/management/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)'],
};
