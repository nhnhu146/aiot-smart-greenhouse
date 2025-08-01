import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	LayoutDashboard,
	History,
	Settings,
	Cog,
	Globe,
	LogOut,
	User as UserIcon
} from 'lucide-react';
import authService, { User } from '@/lib/authService';
import './Sidebar.css';

const navItems = [
	{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
	{ label: 'History', icon: History, path: '/history' },
	{ label: 'AutoMode', icon: Cog, path: '/automode' },
	{ label: 'Settings', icon: Settings, path: '/settings' },
	{ label: 'API Examples', icon: Globe, path: '/examples' },
];

const Sidebar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const currentUser = authService.getCurrentUser();
		setUser(currentUser);
	}, []);

	const handleSignOut = async () => {
		await authService.signOut();
		setUser(null);
		navigate('/signin');
	};

	return (
		<div className="sidebar-wrapper">
			<div className="sidebar-content">
				<img className="sidebar-logo" src="/logo.svg" alt="GreenHouse Logo" width={170} height={100} />

				<nav className="sidebar-nav">
					{navItems.map((item, index) => {
						const IconComponent = item.icon;
						return (
							<div
								key={index}
								className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
								onClick={() => navigate(item.path)}
							>
								<IconComponent size={20} className="nav-icon" />
								{item.label}
							</div>
						);
					})}
				</nav>

				<div
					className="sign-out"
					onClick={handleSignOut}
				>
					<LogOut size={20} className="nav-icon" />
					Sign out
				</div>

				<div className="avatar-wrapper">
					<UserIcon size={30} className="nav-icon" />
					<p className="user-email">{user?.email || 'User'}</p>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
