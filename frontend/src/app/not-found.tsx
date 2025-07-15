'use client';

import { Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NotFound() {
	const router = useRouter();

	return (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: '100vh',
			textAlign: 'center',
			padding: '20px'
		}}>
			<h1>404 - Page Not Found</h1>
			<p className="text-muted mb-4">
				The page you are looking for could not be found.
			</p>
			<Button
				variant="primary"
				onClick={() => router.push('/dashboard')}
			>
				Return to Dashboard
			</Button>
		</div>
	);
}
