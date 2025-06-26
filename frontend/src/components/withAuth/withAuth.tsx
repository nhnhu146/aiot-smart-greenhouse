'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/authService';

const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
	const AuthenticatedComponent = (props: P) => {
		const [isLoading, setIsLoading] = useState(true);
		const [isAuthenticated, setIsAuthenticated] = useState(false);
		const router = useRouter();

		useEffect(() => {
			const checkAuth = () => {
				const authenticated = authService.isAuthenticated();
				console.log('withAuth - authentication check:', authenticated);

				setIsAuthenticated(authenticated);

				if (!authenticated) {
					console.log('withAuth - redirecting to signin');
					router.push('/signin');
				} else {
					setIsLoading(false);
				}
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
			return null; // Will redirect to signin
		}

		return <Component {...props} />;
	};

	AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
	return AuthenticatedComponent;
};

export default withAuth;
