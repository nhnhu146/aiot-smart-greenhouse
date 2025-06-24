'use client';
import React, { useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import Image from 'react-bootstrap/Image';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import styles from './Sidebar.module.scss';

const navItems = [
  { label: 'Dashboard', icon: '/dashboard.svg', path: '/dashboard' },
  { label: 'Activity', icon: '/activity.svg', path: '/activity' },
  { label: 'Green bot', icon: '/chatbot.svg', path: '/chatbot' },
  { label: 'History', icon: '/cloud.svg', path: '/history' },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const [user] = useAuthState(auth);
  const router = useRouter();

  const [userSession, setUserSession] = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem('user');
    setUserSession(session);
    if (!user && !session) {
      router.push('/signin');
    }
  }, [user, router]);

  return (
    <div className={styles.sidebarWrapper}>
      <div className={styles.sidebarContent}>
        <Image className={styles.logo} src="/logo.svg" alt="GreenHouse Logo" width={170} height={100} />

        <Nav className="flex-column d-flex">
          {navItems.map((item, index) => (
            <div
              key={index}
              className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
              onClick={() => window.location.assign(item.path)}
            >
              <Image src={item.icon} alt={`${item.label} Icon`} width={20} height={20} className={styles.icon} />
              {item.label}
            </div>
          ))}
        </Nav>

        <div
          className={styles.signOut}
          onClick={() => {
            signOut(auth);
            sessionStorage.removeItem('user');
            router.push('/signin');
          }}
        >
          <Image src='/logout.svg' alt='Logout Icon' width={20} height={20} className={styles.icon} />
          Sign out
        </div>

        <div className={styles.avatarWrapper}>
          <Image src="/avatar.svg" alt="Avatar" width={40} height={40} className={styles.icon} />
          <p className='my-2'>User</p>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
