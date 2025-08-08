
import { Settings } from '../../models';
import { APIResponse } from '../../types';
import {
	
	EmailRecipientsSchema,
	EmailAlertsSchema,
	validateAlertFrequency
} from './SettingsValidation';
/**
 * Additional settings operations split from main controller
 */
export class SettingsOperations {
	/**
	 * Update email recipients
	 */
	static async updateEmailRecipients(data: any): Promise<APIResponse> {
		const validatedData = EmailRecipientsSchema.parse(data);
		await Settings.findOneAndUpdate(
			{}, // Find any settings document (there should be only one)
			{ $set: { 'notifications.emailRecipients': validatedData.recipients } },
			{ upsert: true, new: true }
		);
		return {
			success: true,
			data: validatedData,
			message: 'Email recipients updated successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Update email alert configuration
	 */
	static async updateEmailAlerts(data: any): Promise<APIResponse> {
		const validatedData = EmailAlertsSchema.parse(data);
		await Settings.findOneAndUpdate(
			{}, // Find any settings document (there should be only one)
			{ $set: { emailAlerts: validatedData } },
			{ upsert: true, new: true }
		);
		return {
			success: true,
			data: validatedData,
			message: 'Email alerts updated successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Update notification preferences
	 */
	static async updateNotifications(data: any): Promise<APIResponse> {
		await Settings.findOneAndUpdate(
			{ /* TODO: Implement */ },
			{ $set: { notifications: data.notifications } },
			{ upsert: true, new: true }
		);
		return {
			success: true,
			data: data,
			message: 'Notification preferences updated successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Update auto control settings
	 */
	static async updateAutoControl(data: any): Promise<APIResponse> {
		await Settings.findOneAndUpdate(
			{ /* TODO: Implement */ },
			{ $set: { autoControl: data.autoControl } },
			{ upsert: true, new: true }
		);
		return {
			success: true,
			data: data,
			message: 'Auto control settings updated successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Reset settings to defaults
	 */
	static async resetSettings(): Promise<APIResponse> {
		const defaultSettings = {
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 30, max: 70 },
			waterLevelThreshold: { min: 20, max: 90 },
			autoControl: { light: true, pump: true, door: true },
			notifications: { email: true, threshold: true, emailRecipients: [] },
			emailAlerts: { temperature: true, humidity: true, soilMoisture: true, waterLevel: true }
		};
		await Settings.findOneAndUpdate(
			{}, // Find any settings document (there should be only one)
			{ $set: defaultSettings },
			{ upsert: true, new: true }
		);
		return {
			success: true,
			data: defaultSettings,
			message: 'Settings reset to defaults successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Test alert system
	 */
	static async testAlert(): Promise<APIResponse> {
		try {
			// Import email service
			const { emailService } = await import('../../services');
			
			// Get current settings to find recipients
			const settings = await Settings.findOne().lean();
			const recipients = settings?.notifications?.emailRecipients || [];
			
			if (recipients.length === 0) {
				return {
					success: false,
					message: 'No email recipients configured. Please add email addresses first.',
					timestamp: new Date().toISOString()
				};
			}

			// Send test email through email service
			console.log('🔔 Sending test email to:', recipients.join(', '));
			const success = await emailService.sendTestEmail(recipients);
			
			if (success) {
				console.log('✅ Test email sent successfully');
				return {
					success: true,
					message: `Test email sent successfully to ${recipients.length} recipient(s)`,
					timestamp: new Date().toISOString()
				};
			} else {
				console.log('❌ Test email failed to send');
				return {
					success: false,
					message: 'Test email failed to send. Please check email configuration.',
					timestamp: new Date().toISOString()
				};
			}
		} catch (error) {
			console.error('❌ Test alert failed:', error);
			return {
				success: false,
				message: 'Test email failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
				timestamp: new Date().toISOString()
			};
		}
	}

	/**
	 * Test email with specific recipients
	 */
	static async testEmailWithRecipients(recipients: string[]): Promise<APIResponse> {
		try {
			// Import email service
			const { emailService } = await import('../../services');
			
			if (!recipients || recipients.length === 0) {
				return {
					success: false,
					message: 'No email recipients provided. Please add email addresses first.',
					timestamp: new Date().toISOString()
				};
			}

			// Send test email through email service
			console.log('🔔 Sending test email to:', recipients.join(', '));
			const success = await emailService.sendTestEmail(recipients);
			
			if (success) {
				console.log('✅ Test email sent successfully');
				return {
					success: true,
					message: `Test email sent successfully to ${recipients.length} recipient(s): ${recipients.join(', ')}`,
					timestamp: new Date().toISOString()
				};
			} else {
				console.log('❌ Test email failed to send');
				return {
					success: false,
					message: 'Test email failed to send. Please check email configuration and recipient addresses.',
					timestamp: new Date().toISOString()
				};
			}
		} catch (error) {
			console.error('❌ Test email failed:', error);
			return {
				success: false,
				message: 'Test email failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
				timestamp: new Date().toISOString()
			};
		}
	}

	/**
	 * Update alert frequency
	 */
	static async updateAlertFrequency(data: any): Promise<APIResponse> {
		const { alertFrequency, batchAlerts } = data;
		const isValid = validateAlertFrequency(alertFrequency);
		if (!isValid) {
			return {
				success: false,
				message: 'Invalid alert frequency. Must be a number between 1 and 60 minutes.',
				timestamp: new Date().toISOString()
			};
		}

		const updateData: any = {};
		if (alertFrequency !== undefined) {
			updateData['notifications.alertFrequency'] = alertFrequency;
		}
		if (batchAlerts !== undefined) {
			updateData['notifications.batchAlerts'] = batchAlerts;
		}

		await Settings.findOneAndUpdate(
			{}, // Find any settings document (there should be only one)
			{ $set: updateData },
			{ upsert: true, new: true }
		);
		return {
			success: true,
			data: { alertFrequency, batchAlerts },
			message: 'Alert frequency updated successfully',
			timestamp: new Date().toISOString()
		};
	}
}
