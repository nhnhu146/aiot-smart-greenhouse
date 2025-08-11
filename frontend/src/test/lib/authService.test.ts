import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from '../../../src/lib/authService';

// Mock fetch and DOM APIs
(globalThis as any).fetch = vi.fn();

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
	writable: true,
	value: '',
});

// Mock window.location
Object.defineProperty(window, 'location', {
	value: {
		protocol: 'http:',
		host: 'localhost:3000',
	},
	writable: true,
});

describe('AuthService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		// Reset authService state by clearing currentUser
		(authService as any).currentUser = null;
	});

	describe('signIn', () => {
		it('should login successfully and store token', async () => {
			const mockResponse = {
				success: true,
				user: { id: '1', email: 'test@example.com' },
				token: 'test-token'
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await authService.signIn('test@example.com', 'password');

			expect(result.success).toBe(true);
			expect(result.data?.token).toBe('test-token');
			expect(localStorage.getItem('token')).toBe('test-token');
			expect(fetch).toHaveBeenCalledWith(
				'http://localhost:5000/api/auth/signin',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: 'test@example.com', password: 'password' })
				})
			);
		});

		it('should handle login failure', async () => {
			const mockResponse = {
				success: false,
				message: 'Invalid credentials'
			};

			(fetch as any).mockResolvedValueOnce({
				ok: false,
				json: async () => mockResponse
			});

			const result = await authService.signIn('test@example.com', 'wrong-password');

			expect(result.success).toBe(false);
			expect(result.message).toBe('Invalid credentials');
			expect(localStorage.getItem('token')).toBeNull();
		});
	});

	describe('signUp', () => {
		it('should register successfully', async () => {
			const mockResponse = {
				success: true,
				user: { id: '1', email: 'test@example.com' },
				token: 'test-token'
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await authService.signUp('test@example.com', 'password123');

			expect(result.success).toBe(true);
			expect(localStorage.getItem('token')).toBe('test-token');
		});
	});

	describe('forgotPassword', () => {
		it('should send forgot password request', async () => {
			const mockResponse = {
				success: true,
				message: 'Reset email sent'
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await authService.forgotPassword('test@example.com');

			expect(result.success).toBe(true);
			expect(fetch).toHaveBeenCalledWith(
				'http://localhost:5000/api/auth/forgot-password',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: 'test@example.com' })
				})
			);
		});
	});

	describe('resetPassword', () => {
		it('should reset password successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Password reset successful'
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await authService.resetPassword('reset-token', 'newpassword');

			expect(result.success).toBe(true);
			expect(fetch).toHaveBeenCalledWith(
				'http://localhost:5000/api/auth/reset-password',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token: 'reset-token', newPassword: 'newpassword' })
				})
			);
		});
	});

	describe('signOut', () => {
		it('should clear stored token', () => {
			localStorage.setItem('token', 'test-token');

			authService.signOut();

			expect(localStorage.getItem('token')).toBeNull();
		});
	});

	describe('isAuthenticated', () => {
		it('should return true when token exists', () => {
			localStorage.setItem('token', 'test-token');
			localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));

			// Reinitialize authService to pick up localStorage
			(authService as any).currentUser = { id: '1', email: 'test@example.com', token: 'test-token' };

			expect(authService.isAuthenticated()).toBe(true);
		});

		it('should return false when token does not exist', () => {
			expect(authService.isAuthenticated()).toBe(false);
		});
	});
});
