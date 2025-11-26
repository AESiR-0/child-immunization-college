import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
  const isOnChart = nextUrl.pathname.startsWith('/chart');
  const isOnLogin = nextUrl.pathname.startsWith('/login');
  const isOnSignup = nextUrl.pathname.startsWith('/signup');
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

  // Allow API auth routes
  if (isApiAuth) {
    return NextResponse.next();
  }

  // Protect dashboard and chart routes
  if ((isOnDashboard || isOnChart) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Redirect logged-in users away from login/signup
  if (isLoggedIn && (isOnLogin || isOnSignup)) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

