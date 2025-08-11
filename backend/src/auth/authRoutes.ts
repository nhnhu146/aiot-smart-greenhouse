import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { users, passwordResetTokens, generateToken, User, PasswordResetToken } from './authService';
import { asyncHandler } from '../middleware';
import { AppConstants } from '../config/AppConfig';
const router = Router();
// Sign in route
router.post('/signin', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			res.status(400).json({
				success: false,
				message: 'Email and password are required'
			});
			return;
		}

		// Trim email to handle whitespace issues
		const trimmedEmail = email.trim();
		const user = users.get(trimmedEmail);
		if (!user) {
			res.status(401).json({
				success: false,
				message: 'Invalid email or password'
			});
			return;
		}

		// Use bcrypt to compare password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			res.status(401).json({
				success: false,
				message: 'Invalid email or password'
			});
			return;
		}

		// Update last login
		user.lastLogin = new Date();
		const token = generateToken({ id: user.id, email: user.email });
		res.json({
			success: true,
			user: { id: user.id, email: user.email },
			token,
			message: 'Sign in successful'
		});
	} catch (error) {
		console.error('Sign in error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
}));
// Sign up route
router.post('/signup', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			res.status(400).json({
				success: false,
				message: 'Email and password are required'
			});
			return;
		}

		// Trim email to handle whitespace issues
		const trimmedEmail = email.trim();
		if (users.has(trimmedEmail)) {
			res.status(409).json({
				success: false,
				message: 'User already exists'
			});
			return;
		}

		// Hash password before saving
		const hashedPassword = await bcrypt.hash(password, 10);
		const user: User = {
			id: Date.now().toString(),
			email: trimmedEmail,
			password: hashedPassword,
			createdAt: new Date()
		};
		users.set(trimmedEmail, user);
		const token = generateToken({ id: user.id, email: user.email });
		res.json({
			success: true,
			user: { id: user.id, email: user.email },
			token,
			message: 'Account created successfully'
		});
	} catch (error) {
		console.error('Sign up error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
}));
// Password reset request
router.post('/password-reset', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const { email } = req.body;
		if (!email) {
			res.status(400).json({
				success: false,
				message: 'Email is required'
			});
			return;
		}

		// Trim email to handle whitespace issues
		const trimmedEmail = email.trim();
		const user = users.get(trimmedEmail);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		// Generate password reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + AppConstants.PASSWORD_RESET_EXPIRY); // 1 hour from now

		const passwordResetData: PasswordResetToken = {
			email: trimmedEmail,
			token: resetToken,
			expiresAt,
			createdAt: new Date()
		};
		passwordResetTokens.set(resetToken, passwordResetData);
		// In a real application, send email here
		console.log(`Password reset token for ${trimmedEmail}: ${resetToken}`);
		res.json({
			success: true,
			message: 'Password reset token generated',
			token: resetToken // Remove this in production, send via email instead
		});
	} catch (error) {
		console.error('Password reset error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
}));
// Password reset confirmation
router.post('/password-reset/confirm', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const { token, newPassword } = req.body;
		if (!token || !newPassword) {
			res.status(400).json({
				success: false,
				message: 'Token and new password are required'
			});
			return;
		}

		const resetData = passwordResetTokens.get(token);
		if (!resetData) {
			res.status(404).json({
				success: false,
				message: 'Invalid or expired reset token'
			});
			return;
		}

		if (new Date() > resetData.expiresAt) {
			passwordResetTokens.delete(token);
			res.status(400).json({
				success: false,
				message: 'Reset token has expired'
			});
			return;
		}

		const user = users.get(resetData.email);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;
		user.lastPasswordReset = new Date();
		// Remove the reset token
		passwordResetTokens.delete(token);
		res.json({
			success: true,
			message: 'Password reset successful'
		});
	} catch (error) {
		console.error('Password reset confirmation error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
}));
export default router;