'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html>
			<body>
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '100vh',
					textAlign: 'center',
					padding: '20px',
					fontFamily: 'system-ui, sans-serif'
				}}>
					<h1>Application Error</h1>
					<p style={{ color: '#666', marginBottom: '24px' }}>
						A critical error occurred. Please try refreshing the page.
					</p>
					<button
						onClick={() => reset()}
						style={{
							padding: '12px 24px',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						Try Again
					</button>
				</div>
			</body>
		</html>
	);
}
