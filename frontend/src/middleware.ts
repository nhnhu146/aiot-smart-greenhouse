import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Skip middleware for static files
	if (
		pathname.includes('._next') ||
		pathname.includes('/favicon.ico') ||
		pathname.includes('.svg') ||
		pathname.includes('.png') ||
		pathname.includes('.jpg') ||
		pathname.includes('.jpeg') ||
		pathname.includes('.gif') ||
		pathname.includes('.ico') ||
		pathname.includes('.css') ||
		pathname.includes('.js')
	) {
		return NextResponse.next()
	}

	// Define public paths that don't require authentication
	const publicPaths = [
		'/signin',
		'/signup',
		'/landing',
		'/_next',
		'/favicon.ico',
		'/api',
		'/logo.svg',
		'/avatar.svg',
		'/background.svg',
		'/bot.svg',
		'/chatbot.svg',
		'/close-eye.svg',
		'/cloud.svg',
		'/dashboard.svg',
		'/logout.svg',
		'/next.svg',
		'/notifications.svg',
		'/open-eye.svg',
		'/settings.svg',
		'/setup.svg',
		'/signin.svg',
		'/signup.svg',
		'/vercel.svg',
		'/activity.svg'
	]

	// Check if the path is public
	const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

	// If it's a public path, allow access
	if (isPublicPath) {
		return NextResponse.next()
	}

	// For protected paths, check if user has token
	const token = request.cookies.get('token')?.value ||
		request.headers.get('authorization')?.replace('Bearer ', '')

	// If no token and trying to access protected route, redirect to signin
	if (!token && !isPublicPath) {
		return NextResponse.redirect(new URL('/signin', request.url))
	}

	return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public assets (images, svgs, etc.)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.ico).*)',
	],
}
