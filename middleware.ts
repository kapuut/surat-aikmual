import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const INTERNAL_LOGIN_PATHS = new Set([
  '/admin/login',
  '/sekretaris/login',
  '/kepala-desa/login',
  '/staff/login',
]);

const ALLOWED_PERMOHONAN_SLUGS = new Set([
  'surat-domisili',
  'surat-kematian',
  'surat-kepemilikan',
  'surat-cerai',
  'surat-janda',
  'surat-kehilangan',
  'surat-penghasilan',
  'surat-tidak-punya-rumah',
  'surat-usaha',
]);

function isPermohonanRouteAllowed(pathname: string): boolean {
  if (!pathname.startsWith('/permohonan/')) return true;

  const segments = pathname.split('/').filter(Boolean);
  const slug = segments[1];

  if (!slug) return false;
  if (slug === 'riwayat') return true;

  if (!ALLOWED_PERMOHONAN_SLUGS.has(slug)) return false;

  // Allowed: /permohonan/:slug and /permohonan/:slug/form
  return segments.length <= 3 && (segments.length === 2 || segments[2] === 'form');
}

export async function middleware(request: NextRequest) {
  console.log('Middleware - Processing request:', request.nextUrl.pathname);
  
  const pathname = request.nextUrl.pathname;

  if (!isPermohonanRouteAllowed(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Skip middleware for public routes and API routes
  if (pathname.startsWith('/api/') || 
      pathname === '/login' || 
      pathname === '/register' ||
      pathname === '/' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/public/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (INTERNAL_LOGIN_PATHS.has(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    const targetLogin = getLoginRouteForPath(pathname);
    console.log('No token found, redirecting to login page:', targetLogin);
    return NextResponse.redirect(new URL(targetLogin, request.url));
  }

  try {
    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    );
    
    const userRole = payload.role as string;
    
    // Role-based route protection
    if (pathname.startsWith('/admin/') && userRole !== 'admin') {
      console.log(`Access denied: ${userRole} trying to access admin route`);
      return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
    }
    
    if (pathname.startsWith('/sekretaris/') && userRole !== 'sekretaris') {
      console.log(`Access denied: ${userRole} trying to access sekretaris route`);
      return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
    }
    
    if (pathname.startsWith('/kepala-desa/') && userRole !== 'kepala_desa') {
      console.log(`Access denied: ${userRole} trying to access kepala-desa route`);
      return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
    }

    // Add user info to headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-user-role', userRole);
    requestHeaders.set('x-user-id', payload.userId as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
    
  } catch (error) {
    console.log('Token verification failed:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'sekretaris':
      return '/sekretaris/dashboard';
    case 'kepala_desa':
      return '/kepala-desa/dashboard';
    case 'masyarakat':
      return '/dashboard';
    default:
      return '/login';
  }
}

function getLoginRouteForPath(pathname: string): string {
  if (pathname.startsWith('/admin/')) {
    return '/admin/login';
  }
  if (pathname.startsWith('/sekretaris/')) {
    return '/sekretaris/login';
  }
  if (pathname.startsWith('/kepala-desa/')) {
    return '/kepala-desa/login';
  }
  return '/login';
}

export const config = {
  matcher: [
    // Match all protected routes
    '/admin/:path*',
    '/sekretaris/:path*',
    '/kepala-desa/:path*',
    '/dashboard/:path*',
    '/permohonan/:path*',
    '/surat/:path*',
    '/tracking/:path*'
  ],
};