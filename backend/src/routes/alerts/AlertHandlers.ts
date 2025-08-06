import { Request, Response } from 'express';
import { APIResponse } from '../../types';
import { AppError } from '../../middleware';
import { alertService, emailService } from '../../services';
import { TestEmailSchema, SystemErrorSchema } from './AlertValidation';
export class AlertHandlers {
	/**
	 * Get email service status
	 */
	static async getEmailStatus(req: Request, res: Response) {
		const status = alertService.getEmailStatus();
		const response: APIResponse = {
			success: true,
			data: status,
			message: 'Email service status retrieved successfully',
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	/**
	 * Send test email
	 */
	static async sendTestEmail(req: Request, res: Response) {
		const { recipients } = TestEmailSchema.parse(req.body);
		// Send test email to all recipients
		let allSuccess = true;
		for (const recipient of recipients) {
			const success = await emailService.sendTestEmail(recipient);
			if (!success) allSuccess = false;
		}

		if (allSuccess) {
			const response: APIResponse = {
				success: true,
				message: `Test email sent successfully to ${recipients.length} recipients`,
				data: { recipients },
				timestamp: new Date().toISOString()
			};
			res.json(response);
		} else {
			throw new AppError('Failed to send test email - Email service may not be configured', 400);
		}
	}

	/**
	 * Get current alert thresholds
	 */
	static async getThresholds(req: Request, res: Response) {
		const thresholds = alertService.getCurrentThresholds();
		const response: APIResponse = {
			success: true,
			data: thresholds,
			message: 'Alert thresholds retrieved successfully',
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	/**
	 * Reload thresholds and email settings from database
	 */
	static async reloadSettings(req: Request, res: Response) {
		await alertService.reloadThresholds();
		const response: APIResponse = {
			success: true,
			message: 'Alert settings reloaded successfully',
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	/**
	 * Manually trigger system error alert (for testing)
	 */
	static async triggerSystemError(req: Request, res: Response) {
		const { error = 'Test system error', component = 'Test Component' } = SystemErrorSchema.parse(req.body);
		await alertService.handleSystemError(error, component);
		const response: APIResponse = {
			success: true,
			message: 'System error alert triggered successfully',
			data: { error, component },
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}
}
