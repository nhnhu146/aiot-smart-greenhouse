'use client'
import { Inter } from 'next/font/google'
import AppSidebar from '@/components/Sidebar/Sidebar'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import 'bootstrap/dist/css/bootstrap.min.css';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className={inter.className} style={{ margin: 0, padding: 0 }}>
				<WebSocketProvider>
					<div style={{ display: 'flex', height: '100vh', width: '100%' }}>
						<div style={{ flex: '0 0 240px' }}>
							<AppSidebar />
						</div>
						<div style={{ flex: 1, background: '#DCEECB', overflowY: 'auto' }}>
							{children}
						</div>
					</div>
				</WebSocketProvider>
			</body>
		</html>
	)
}