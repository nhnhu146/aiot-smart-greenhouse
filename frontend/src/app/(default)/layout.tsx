'use client'
// Force dynamic rendering to fix useContext static generation issues
export const dynamic = 'force-dynamic';

import ClientSidebar from '@/components/Sidebar/ClientSidebar'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<WebSocketProvider>
			<div style={{ display: 'flex', height: '100vh', width: '100%' }}>
				<div style={{ flex: '0 0 240px' }}>
					<ClientSidebar />
				</div>
				<div style={{ flex: 1, background: '#DCEECB', overflowY: 'auto' }}>
					{children}
				</div>
			</div>
		</WebSocketProvider>
	)
}