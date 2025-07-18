import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.scss';

// Force dynamic rendering to fix useContext static generation issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'AIoT Smart Greenhouse',
	description: 'Smart greenhouse monitoring and control system',
	viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
	themeColor: '#DCEECB',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
				<meta name="theme-color" content="#DCEECB" />
			</head>
			<body suppressHydrationWarning={true}>
				{children}
			</body>
		</html>
	);
}
