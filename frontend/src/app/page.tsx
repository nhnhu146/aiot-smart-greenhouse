'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/authService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
	const router = useRouter();

	useEffect(() => {
		const checkAuthAndRedirect = () => {
			// Check if user is authenticated
			const isAuthenticated = authService.isAuthenticated();

			console.log('🏠 Homepage redirect check - Authenticated:', isAuthenticated);

			if (isAuthenticated) {
				// User is logged in - redirect to dashboard
				console.log('🏠 Redirecting authenticated user to dashboard');
				router.replace('/dashboard');
			} else {
				// User is not logged in - redirect to landing page
				console.log('🏠 Redirecting unauthenticated user to landing page');
				router.replace('/landing');
			}
		};

		// Small delay to ensure auth service is initialized
		const timeoutId = setTimeout(checkAuthAndRedirect, 100);

		return () => clearTimeout(timeoutId);
	}, [router]);

	// Show loading state while redirecting
	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh',
			backgroundColor: '#f8f9fa'
		}}>
			<div style={{ textAlign: 'center' }}>
				<div style={{
					width: '40px',
					height: '40px',
					border: '4px solid #f3f3f3',
					borderTop: '4px solid #57ae09',
					borderRadius: '50%',
					animation: 'spin 1s linear infinite',
					margin: '0 auto 16px'
				}} />
				<p style={{ color: '#6c757d', fontSize: '16px' }}>
					Loading...
				</p>
			</div>

			<style jsx>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
}
