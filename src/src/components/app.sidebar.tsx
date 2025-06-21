'use client';
import React from 'react';
import { Nav } from 'react-bootstrap';
import Image from 'react-bootstrap/Image';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

// Danh sách các mục trong sidebar
const navItems = [
  { label: 'Dashboard', icon: '/dashboard.svg', path: '/dashboard' },
  { label: 'Activity', icon: '/activity.svg', path: '/activity' },
  { label: 'Green bot', icon: '/chatbot.svg', path: '/chatbot' },
  { label: 'History', icon: '/cloud.svg', path: '/history' },
];

const AppSidebar = () => {
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  const [user] = useAuthState(auth);
  const router = useRouter();

  const userSession = sessionStorage.getItem('user');

  console.log({ user });

  if (!user && !userSession) {
    router.push('/signin');
  }

  return (
    <div className='align-items-center' style={{ width: '200px', height: '100vh', backgroundColor: '#fff', color: '#333333' }}>
      <div style={{ position: 'fixed', display: 'flex', flexDirection: 'column', height: '100vh', width: '240px' }}>
        <div>
          <Image className="mb-5 mx-4 my-2" src="/logo.svg" alt="GreenHouse Logo" width={150} height={100} />
          <Nav className="flex-column d-flex">
            {navItems.map((item, index) => (
              <div
                style={{
                  backgroundColor: pathname === item.path ? '#DCEECB' : 'transparent',
                  color: pathname === item.path ? '#085404' : '#000000',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '7px',
                }}
                onClick={() => window.location.assign(item.path)}
                className="d-flex nav-link align-items-center mb-2"
              >
                <Image src={item.icon} alt={`${item.label} Icon`} width={20} height={20} className="mx-2" />
                {item.label}
              </div>
            ))}
          </Nav>
        </div>
        <div
          style={{ color: '#000000', cursor: 'pointer', padding: '0.5rem', borderRadius: '7px' }}
          className="d-flex nav-link align-items-center mb-2"
          onClick={() => {
            signOut(auth)
            sessionStorage.removeItem('user')
          }}>
          <Image src='/logout.svg' alt='Logout Icon' width={20} height={20} className="mx-2" />
          Sign out
        </div>

        {/* Avatar ở dưới cùng */}
        <div className="mt-auto d-flex align-items-center p-2">
          <Image src="/avatar.svg" alt="Avatar" width={40} height={40} className="mx-2" />
          <p className='my-2'>User</p>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
