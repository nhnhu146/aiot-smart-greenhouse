'use client';
import React, { useEffect, useState } from 'react';
import { Nav, Image } from 'react-bootstrap';
import { usePathname, useRouter } from 'next/navigation';
import authService, { User } from '@/lib/authService';
import styles from './Sidebar.module.scss';

const navItems = [
	{ label: 'Dashboard', icon: '/dashboard.svg', path: '/dashboard' },
	{ label: 'Control', icon: '/activity.svg', path: '/control' },
	// { label: 'Green bot', icon: '/chatbot.svg', path: '/chatbot' }, // Hidden for now
	{ label: 'History', icon: '/cloud.svg', path: '/history' },
	{ label: 'Settings', icon: '/settings.svg', path: '/settings' },
];

const AppSidebar = () => {
	const pathname = usePathname();
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const currentUser = authService.getCurrentUser();
		setUser(currentUser);
	}, []);

	const handleSignOut = async () => {
		await authService.signOut();
		setUser(null);
		router.push('/signin');
	};

	return (
		<div className={styles.sidebarWrapper}>
			<div className={styles.sidebarContent}>
				<Image className={styles.logo} src="/logo.svg" alt="GreenHouse Logo" width={170} height={100} />

				<Nav className="flex-column d-flex">
					{navItems.map((item, index) => (
						<div
							key={index}
							className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
							onClick={() => router.push(item.path)}
						>
							<Image src={item.icon} alt={`${item.label} Icon`} width={20} height={20} className={styles.icon} />
							{item.label}
						</div>
					))}
				</Nav>

				<div
					className={styles.signOut}
					onClick={handleSignOut}
				>
					<Image src='/logout.svg' alt='Logout Icon' width={20} height={20} className={styles.icon} />
					Sign out
				</div>

				<div className={styles.avatarWrapper}>
					<Image src="/avatar.svg" alt="Avatar" width={30} height={30} className={styles.icon} />
					<p className='my-2'>{user?.email || 'User'}</p>
				</div>
			</div>
		</div>
	);
};

export default AppSidebar;
