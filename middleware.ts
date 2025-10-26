import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that don't require authentication
const publicRoutes = [
  '/dashboard/receptionist',
  '/dashboard/receptionist/',
  '/dashboard/receptionist/patients',
  '/dashboard/receptionist/patients/',
];

// Define routes that require authentication
const protectedRoutes = [
  '/dashboard/admin',
  '/dashboard/doctor',
  '/dashboard/pharmacist',
  '/dashboard/setup',
  '/api/auth/logout',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is a public receptionist route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if the route is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Allow access to public receptionist routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, we would normally check authentication here
  // But since we're not implementing full authentication middleware,
  // we'll just pass through for now
  if (isProtectedRoute) {
    // In a real implementation, we would check for valid session tokens here
    // For now, we'll allow the existing client-side authentication to handle it
    return NextResponse.next();
  }
  
  // Allow all other routes to proceed normally
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/auth/:path*',
  ],
};