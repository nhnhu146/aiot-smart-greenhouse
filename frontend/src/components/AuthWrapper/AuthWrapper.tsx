'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/authService';

interface AuthWrapperProps {
	children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const checkAuth = () => {
			const authenticated = authService.isAuthenticated();
			setIsAuthenticated(authenticated);

			if (!authenticated) {
				router.push('/signin');
			}
			setIsLoading(false);
		};

		checkAuth();
	}, [router]);

	if (isLoading) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh'
			}}>
				<div>Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null; // Router will redirect to signin
	}

	return <>{children}</>;
};

export default AuthWrapper;
