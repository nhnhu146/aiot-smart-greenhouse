import React from 'react';

interface AuthLayoutProps {
	children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div style={{ backgroundColor: "#DCEECB", minHeight: "100vh" }}>
			{children}
		</div>
	)
}
