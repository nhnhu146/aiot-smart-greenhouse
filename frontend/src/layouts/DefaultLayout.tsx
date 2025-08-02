import React from 'react';
import Sidebar from '@/components/Sidebar/Sidebar'

interface DefaultLayoutProps {
	children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
	return (
		<div style={{ display: 'flex', height: '100vh', width: '100%' }}>
			<div style={{ flex: '0 0 240px' }}>
				<Sidebar />
			</div>
			<div style={{ flex: 1, background: '#DCEECB', overflowY: 'auto' }}>
				{children}
			</div>
		</div>
	)
}
