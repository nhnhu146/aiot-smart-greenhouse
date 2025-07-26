import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { PasswordReset } from '../models';
import { emailService } from '../services';

const router = express.Router();

// Rate limiting for password reset requests
const resetRequestLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 3000, // Maximum 3000 requests per IP per window
	message: {
		success: false,
		message: 'Too many password reset requests. Please try again later.'
	},
	standardHeaders: true,
	legacyHeaders: false
});

const resetPasswordLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 3000, // Maximum 3000 reset attempts per IP per window
	message: {
		success: false,
		message: 'Too many password reset attempts. Please try again later.'
	},
	standardHeaders: true,
	legacyHeaders: false
});

// In-memory user store (should be replaced with database)
declare global {
	var users: Map<string, any>;
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', resetRequestLimit, async (req: Request, res: Response): Promise<void> => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(400).json({
				success: false,
				message: 'Email is required'
			});
			return;
		}

		const trimmedEmail = email.trim().toLowerCase();

		// Check if user exists
		const user = global.users?.get(trimmedEmail);

		// Always return success to prevent email enumeration
		// But only send email if user actually exists
		if (user) {
			try {
				// Generate secure random token
				const resetToken = crypto.randomBytes(32).toString('hex');

				// Set expiration time (1 hour from now)
				const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

				// Save reset token to database
				const passwordReset = new PasswordReset({
					email: trimmedEmail,
					token: resetToken,
					expiresAt,
					used: false
				});

				await passwordReset.save();

				// Generate reset URL
				const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

				// Send password reset email
				const emailSent = await emailService.sendPasswordResetEmail(trimmedEmail, resetToken);

				console.log(`🔐 Password reset requested for: ${trimmedEmail}`);
			} catch (error) {
				console.error('Error processing password reset:', error);
				// Don't reveal the error to prevent information disclosure
			}
		}

		// Always return success response
		res.status(200).json({
			success: true,
			message: 'If your email is registered, you will receive a password reset link.'
		});

	} catch (error) {
		console.error('Forgot password error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

/**
 * Verify reset token
 * GET /api/auth/verify-reset-token/:token
 */
router.get('/verify-reset-token/:token', async (req: Request, res: Response): Promise<void> => {
	try {
		const { token } = req.params;

		if (!token) {
			res.status(400).json({
				success: false,
				message: 'Reset token is required'
			});
			return;
		}

		// Find the reset token
		const passwordReset = await PasswordReset.findOne({
			token,
			used: false,
			expiresAt: { $gt: new Date() }
		});

		if (!passwordReset) {
			res.status(400).json({
				success: false,
				message: 'Invalid or expired reset token'
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: 'Valid reset token',
			data: {
				email: passwordReset.email
			}
		});

	} catch (error) {
		console.error('Verify reset token error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
router.post('/reset-password', resetPasswordLimit, async (req: Request, res: Response): Promise<void> => {
	try {
		const { token, newPassword } = req.body;

		if (!token || !newPassword) {
			res.status(400).json({
				success: false,
				message: 'Reset token and new password are required'
			});
			return;
		}

		// Validate password strength
		if (newPassword.length < 6) {
			res.status(400).json({
				success: false,
				message: 'Password must be at least 6 characters long'
			});
			return;
		}

		// Find and validate the reset token
		const passwordReset = await PasswordReset.findOne({
			token,
			used: false,
			expiresAt: { $gt: new Date() }
		});

		if (!passwordReset) {
			res.status(400).json({
				success: false,
				message: 'Invalid or expired reset token'
			});
			return;
		}

		// Get user from in-memory store
		const user = global.users?.get(passwordReset.email);

		if (!user) {
			res.status(400).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update user password
		user.password = hashedPassword;
		user.lastPasswordReset = new Date();
		global.users?.set(passwordReset.email, user);

		// Mark reset token as used
		passwordReset.used = true;
		await passwordReset.save();

		// Send confirmation email
		try {
			await emailService.sendPasswordResetEmail(passwordReset.email, passwordReset.token);
		} catch (emailError) {
			console.error('Failed to send confirmation email:', emailError);
			// Don't fail the request if email fails
		}

		console.log(`✅ Password reset successful for: ${passwordReset.email}`);

		res.status(200).json({
			success: true,
			message: 'Password reset successful. You can now login with your new password.'
		});

	} catch (error) {
		console.error('Reset password error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

/**
 * Test email functionality
 * POST /api/auth/test-email
 */
router.post('/test-email', async (req: Request, res: Response): Promise<void> => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(400).json({
				success: false,
				message: 'Email is required'
			});
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			res.status(400).json({
				success: false,
				message: 'Invalid email format'
			});
			return;
		}

		console.log(`📧 Sending test email to: ${email}`);

		// Send test email
		const success = await emailService.sendTestEmail(email);

		if (success) {
			res.status(200).json({
				success: true,
				message: 'Test email sent successfully'
			});
		} else {
			res.status(500).json({
				success: false,
				message: 'Failed to send test email. Email service may not be configured.'
			});
		}

	} catch (error) {
		console.error('Test email error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

export default router;
