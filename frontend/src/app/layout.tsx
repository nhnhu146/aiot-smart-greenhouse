import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';

// Force dynamic rendering to fix useContext static generation issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'AIoT Smart Greenhouse',
	description: 'Smart greenhouse monitoring and control system',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body suppressHydrationWarning={true}>
				{children}
			</body>
		</html>
	);
}
