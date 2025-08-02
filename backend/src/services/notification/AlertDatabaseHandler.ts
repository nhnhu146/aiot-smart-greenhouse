import { Alert, Settings } from '../../models';

/**
 * Alert Database Handler - Manages alert persistence
 * Focused on database operations for alerts
 */

export interface AlertData {
	type: 'temperature' | 'humidity' | 'soilMoisture' | 'waterLevel' | 'device' | 'system';
	level: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	currentValue?: number;
	threshold?: { min?: number; max?: number } | null;
	deviceType?: string;
}

export class AlertDatabaseHandler {
	/**
	 * Save alert to database
	 */
	async saveAlert(alertData: AlertData): Promise<void> {
		try {
			const alert = new Alert({
				type: alertData.type,
				level: alertData.level,
				message: alertData.message,
				value: alertData.currentValue,
				threshold: alertData.threshold ? {
					min: alertData.threshold.min,
					max: alertData.threshold.max
				} : undefined,
				deviceType: alertData.deviceType,
				timestamp: new Date(),
				resolved: false
			});

			await alert.save();
			console.log(`Alert saved to database: ${alertData.type} - ${alertData.level}`);
		} catch (error) {
			console.error('Error saving alert to database:', error);
			throw error;
		}
	}

	/**
	 * Get email recipients from settings
	 */
	async getEmailRecipients(): Promise<string[]> {
		try {
			const settings = await Settings.findOne();
			return settings?.notifications?.emailRecipients || [];
		} catch (error) {
			console.error('Error fetching email recipients:', error);
			return [];
		}
	}

	/**
	 * Get alert settings
	 */
	async getAlertSettings(): Promise<any> {
		try {
			const settings = await Settings.findOne();
			return {
				frequency: (settings?.notifications as any)?.alertFrequency || 5,
				batchAlerts: (settings?.notifications as any)?.batchAlerts || false,
				emailEnabled: settings?.notifications?.email || false,
				emailAlerts: settings?.emailAlerts || {}
			};
		} catch (error) {
			console.error('Error fetching alert settings:', error);
			return {
				frequency: 5,
				batchAlerts: false,
				emailEnabled: false,
				emailAlerts: {}
			};
		}
	}

	/**
	 * Mark alerts as resolved
	 */
	async resolveAlerts(alertIds: string[]): Promise<void> {
		try {
			await Alert.updateMany(
				{ _id: { $in: alertIds } },
				{ $set: { resolved: true, resolvedAt: new Date() } }
			);
		} catch (error) {
			console.error('Error resolving alerts:', error);
			throw error;
		}
	}

	/**
	 * Get recent alerts
	 */
	async getRecentAlerts(limit: number = 10): Promise<any[]> {
		try {
			return await Alert.find()
				.sort({ timestamp: -1 })
				.limit(limit)
				.lean();
		} catch (error) {
			console.error('Error fetching recent alerts:', error);
			return [];
		}
	}
}
