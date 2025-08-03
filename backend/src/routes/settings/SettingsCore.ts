import { Settings } from '../../models';
import { APIResponse } from '../../types';
import { ThresholdSchema } from './SettingsValidation';
import { webSocketService } from '../../services';

/**
 * Settings Controller - Core settings operations only
 */
export class SettingsController {
	/**
	 * Get current system settings
	 */
	static async getSettings(): Promise<APIResponse> {
		const settings = await Settings.findOne().lean();

		return {
			success: true,
			data: settings || {
				temperatureThreshold: { min: 18, max: 30 },
				humidityThreshold: { min: 40, max: 80 },
				soilMoistureThreshold: { min: 30, max: 70 },
				waterLevelThreshold: { min: 20, max: 90 },
				autoControl: { light: true, pump: true, door: true },
				notifications: { email: true, threshold: true, emailRecipients: [] },
				emailAlerts: { temperature: true, humidity: true, soilMoisture: true, waterLevel: true }
			},
			message: 'Settings retrieved successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Update alert thresholds
	 */
	static async updateThresholds(data: any): Promise<APIResponse> {
		const validatedData = ThresholdSchema.parse(data);

		const updatedSettings = await Settings.findOneAndUpdate(
			{},
			{ $set: validatedData },
			{ upsert: true, new: true }
		);

		// Broadcast threshold update via WebSocket
		webSocketService.broadcastThresholdUpdate(validatedData);

		// Broadcast database change
		webSocketService.broadcastDatabaseChange('Settings', 'update', {
			type: 'thresholds',
			data: validatedData
		});

		return {
			success: true,
			data: validatedData,
			message: 'Thresholds updated successfully',
			timestamp: new Date().toISOString()
		};
	}
}
