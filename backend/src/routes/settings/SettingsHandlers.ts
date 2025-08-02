import { Request, Response } from 'express';
import { SettingsController } from './SettingsCore';
import { SettingsO		try {
	const response = await SettingsOperations.testAlert();
	res.json(response);
} catch (error) { tions } from './SettingsOperations';
import { EmailRecipientsSchema } from './SettingsValidation';

/**
 * Settings Route Handlers - HTTP request/response handling
 * Focused on handling HTTP layer concerns and delegation to controller
 */

export class SettingsHandlers {
	/**
	 * Handle GET /api/settings
	 */
	static async getSettings(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsController.getSettings();
			res.json(response);
		} catch (error) {
			console.error('Error retrieving settings:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to retrieve settings',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings/thresholds
	 */
	static async updateThresholds(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsController.updateThresholds(req.body);
			res.json(response);
		} catch (error) {
			console.error('Error updating thresholds:', error);
			res.status(400).json({
				success: false,
				message: error instanceof Error ? error.message : 'Failed to update thresholds',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings/email-recipients
	 */
	static async updateEmailRecipients(req: Request, res: Response): Promise<void> {
		try {
			const result = await SettingsOperations.updateEmailRecipients(req.body);
			res.json(result);
		} catch (error) {
			console.error('Error updating email recipients:', error);
			res.status(400).json({
				success: false,
				message: error instanceof Error ? error.message : 'Failed to update email recipients',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings/email-alerts
	 */
	static async updateEmailAlerts(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsOperations.updateEmailAlerts(req.body);
			res.json(response);
		} catch (error) {
			console.error('Error updating email alerts:', error);
			res.status(400).json({
				success: false,
				message: error instanceof Error ? error.message : 'Failed to update email alerts',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings
	 */
	static async saveCompleteSettings(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsOperations.resetSettings();
			res.json(response);
		} catch (error) {
			console.error('Error saving settings:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to save settings',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings/test-email
	 */
	static async testEmail(req: Request, res: Response): Promise<void> {
		try {
			const { recipients } = EmailRecipientsSchema.parse(req.body);
			const response = await SettingsController.testEmail(recipients);
			res.json(response);
		} catch (error) {
			console.error('Error sending test email:', error);
			res.status(400).json({
				success: false,
				message: error instanceof Error ? error.message : 'Failed to send test email',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle GET /api/settings/email-status
	 */
	static async getEmailStatus(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsController.getEmailStatus();
			res.json(response);
		} catch (error) {
			console.error('Error getting email status:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to get email status',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings/alert-frequency
	 */
	static async updateAlertFrequency(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsController.updateAlertFrequency(req.body);
			res.json(response);
		} catch (error) {
			console.error('Error saving alert frequency settings:', error);
			res.status(error instanceof Error && error.message.includes('frequency') ? 400 : 500).json({
				success: false,
				message: error instanceof Error ? error.message : 'Failed to save alert frequency settings',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handle POST /api/settings/reset
	 */
	static async resetToDefaults(req: Request, res: Response): Promise<void> {
		try {
			const response = await SettingsController.resetToDefaults();
			res.json(response);
		} catch (error) {
			console.error('Error resetting settings:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to reset settings',
				timestamp: new Date().toISOString()
			});
		}
	}
}
