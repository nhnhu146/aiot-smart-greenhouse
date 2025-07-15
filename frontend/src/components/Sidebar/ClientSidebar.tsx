/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import AppSidebar from './Sidebar';

export default function ClientSidebar() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div style={{ width: '240px', height: '100vh', background: '#f8f9fa' }} />;
	}

	return <AppSidebar />;
}
