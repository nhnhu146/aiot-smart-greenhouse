import express, { Request, Response } from 'express';
import { emailService } from '../../services';

const router = express.Router();

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
