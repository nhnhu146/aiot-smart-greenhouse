import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
	'/dashboard',
	'/history',
	'/settings',
	'/api-examples',
	'/mqtt-examples'
];

const publicRoutes = [
	'/',
	'/signin',
	'/signup',
	'/forgot-password',
	'/reset-password'
];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip middleware for static files and API routes
	if (
		pathname.startsWith('/_next') ||
		pathname.startsWith('/api') ||
		pathname.includes('.') // Files with extensions
	) {
		return NextResponse.next();
	}

	// Check if route needs protection
	const isProtectedRoute = protectedRoutes.some(route =>
		pathname.startsWith(route)
	);

	const isPublicRoute = publicRoutes.some(route =>
		pathname === route || pathname.startsWith(route)
	);

	// Get auth token from cookies
	const token = request.cookies.get('token')?.value;

	// Debug logging
	console.log(`🔍 Middleware - Path: ${pathname}, Token: ${token ? 'present' : 'missing'}, Protected: ${isProtectedRoute}, Public: ${isPublicRoute}`);

	// If accessing protected route without token, redirect to signin
	if (isProtectedRoute && !token) {
		console.log(`🚫 Redirecting to signin: ${pathname} (no token)`);
		const signInUrl = new URL('/signin', request.url);
		signInUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(signInUrl);
	}

	// If accessing signin with valid token, redirect to dashboard
	if (pathname === '/signin' && token) {
		console.log(`✅ Redirecting to dashboard: ${pathname} (has token)`);
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
