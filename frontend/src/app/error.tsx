'use client';

import { Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
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
			<h1>Something went wrong!</h1>
			<p className="text-muted mb-4">
				An unexpected error occurred. Please try again.
			</p>
			<div className="d-flex gap-3">
				<Button
					variant="primary"
					onClick={() => reset()}
				>
					Try Again
				</Button>
				<Button
					variant="secondary"
					onClick={() => router.push('/dashboard')}
				>
					Return to Dashboard
				</Button>
			</div>
		</div>
	);
}
