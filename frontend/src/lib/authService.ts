import { Config } from '../config/AppConfig';

interface User {
	id: string;
	email: string;
	token?: string;
}

interface AuthResponse {
	success: boolean;
	message: string;
	data?: {
		user: User;
		token: string;
	};
}

class AuthService {
	private API_BASE_URL = Config.api.baseUrl;
	private currentUser: User | null = null;

	constructor() {
		// Initialize from localStorage if available
		if (typeof window !== 'undefined') {
			const storedUser = localStorage.getItem('user');
			const storedToken = localStorage.getItem('token');
			if (storedUser && storedToken) {
				try {
					const parsedUser = JSON.parse(storedUser);
					this.currentUser = { ...parsedUser, token: storedToken };
				} catch (error) {
					console.error('Login error:', error);
					this.clearStorage();
				}
			}
		}
	}

	async signIn(email: string, password: string): Promise<AuthResponse> {
		try {
			const response = await fetch(`${this.API_BASE_URL}/api/auth/signin`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: email.trim(), password }),
			});

			const data = await response.json();

			if (data.success && data.user && data.token) {
				this.currentUser = { ...data.user, token: data.token };
				this.saveToStorage(data.user, data.token);

				// Return consistent with AuthResponse interface
				return {
					success: true,
					message: data.message || 'Login successful',
					data: {
						user: data.user,
						token: data.token
					}
				};
			}

			return {
				success: false,
				message: data.message || 'Login failed'
			};
		} catch (error) {
			console.error('Login error:', error);

			return { success: false, message: 'Network error occurred' };
		}
	}

	async signUp(email: string, password: string): Promise<AuthResponse> {
		try {
			const response = await fetch(`${this.API_BASE_URL}/api/auth/signup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: email.trim(), password }),
			});

			const data = await response.json();

			if (data.success && data.user && data.token) {
				this.currentUser = { ...data.user, token: data.token };
				this.saveToStorage(data.user, data.token);

				// Return consistent with AuthResponse interface
				return {
					success: true,
					message: data.message || 'Registration successful',
					data: {
						user: data.user,
						token: data.token
					}
				};
			}

			return {
				success: false,
				message: data.message || 'Registration failed'
			};
		} catch (error) {
			console.error('Login error:', error);

			return { success: false, message: 'Network error occurred' };
		}
	}

	async signOut(): Promise<void> {
		this.currentUser = null;
		this.clearStorage();
	}

	async forgotPassword(email: string): Promise<AuthResponse> {
		try {
			const response = await fetch(`${this.API_BASE_URL}/api/auth/forgot-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: email.trim() }),
			});

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Login error:', error);

			return { success: false, message: 'Network error occurred' };
		}
	}

	async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
		try {
			const response = await fetch(`${this.API_BASE_URL}/api/auth/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token, newPassword }),
			});

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Login error:', error);

			return { success: false, message: 'Network error occurred' };
		}
	}

	getCurrentUser(): User | null {
		return this.currentUser;
	}

	isAuthenticated(): boolean {
		const hasCurrentUser = this.currentUser !== null;
		const hasToken = this.currentUser?.token !== undefined;
		const hasStoredToken = typeof window !== 'undefined' && localStorage.getItem('token') !== null;

		return hasCurrentUser && (hasToken || hasStoredToken);
	}

	getToken(): string | null {
		return this.currentUser?.token || localStorage.getItem('token');
	}

	private saveToStorage(user: User, token: string): void {
		localStorage.setItem('user', JSON.stringify(user));
		localStorage.setItem('token', token);

		// Set cookie for middleware with proper attributes
		const isSecure = window.location.protocol === 'https:';
		const maxAge = 24 * 60 * 60; // 24 hours
		let cookieString = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

		if (isSecure) {
			cookieString += '; Secure';
		}

		document.cookie = cookieString;
	}

	private clearStorage(): void {
		localStorage.removeItem('user');
		localStorage.removeItem('token');
		// Clear cookie properly with all possible attributes
		document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
		// Also try clearing with Secure attribute for HTTPS
		if (window.location.protocol === 'https:') {
			document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure';
		}
	}
}

const authService = new AuthService();
export default authService;
export type { User, AuthResponse };
