import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/lib/authService';

const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
	const AuthenticatedComponent = (props: P) => {
		const [isLoading, setIsLoading] = useState(true);
		const [isAuthenticated, setIsAuthenticated] = useState(false);
		const navigate = useNavigate();

		useEffect(() => {
			const checkAuth = () => {
				const authenticated = authService.isAuthenticated();

				setIsAuthenticated(authenticated);

				if (!authenticated) {
					navigate('/signin');
				} else {
					setIsLoading(false);
				}
			};

			checkAuth();
		}, [navigate]);

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
