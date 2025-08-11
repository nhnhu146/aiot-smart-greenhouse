import { Settings } from '../../models';
import { APIResponse } from '../../types';
import { ThresholdSchema } from './SettingsValidation';
import { webSocketService, alertService } from '../../services';
/**
 * Settings Controller - Core settings operations only
 */
export class SettingsController {
	/**
	 * Get current system settings
	 */
	static async getSettings(): Promise<APIResponse> {
		const settings = await Settings.findOne().lean();
		const defaultSettings = {
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 30, max: 70 },
			waterLevelThreshold: { min: 20, max: 90 },
			autoControl: { light: true, pump: true, door: true },
			notifications: { email: true, threshold: true, emailRecipients: [], alertFrequency: 5, batchAlerts: true },
			emailAlerts: { temperature: true, humidity: true, soilMoisture: true, waterLevel: true }
		};

		if (!settings) {
			return {
				success: true,
				data: {
					...defaultSettings,
					emailRecipients: [], // Map for frontend compatibility
					alertFrequency: 5,
					batchAlerts: true
				},
				message: 'Default settings retrieved',
				timestamp: new Date().toISOString()
			};
		}

		// Map the nested structure to flat structure for frontend compatibility
		const mappedSettings = {
			...settings,
			emailRecipients: settings.notifications?.emailRecipients || [],
			alertFrequency: settings.notifications?.alertFrequency || 5,
			batchAlerts: settings.notifications?.batchAlerts !== undefined ? settings.notifications.batchAlerts : true
		};

		return {
			success: true,
			data: mappedSettings,
			message: 'Settings retrieved successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Update alert thresholds
	 */
	static async updateThresholds(data: any): Promise<APIResponse> {
		const validatedData = ThresholdSchema.parse(data);
		await Settings.findOneAndUpdate(
			{}, // Find any settings document (there should be only one)
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

		// Trigger AlertService to reload thresholds immediately
		try {
			await alertService.reloadThresholds();
			console.log('✅ AlertService thresholds reloaded after settings update');
		} catch (error) {
			console.error('❌ Failed to reload AlertService thresholds:', error);
		}
		return {
			success: true,
			data: validatedData,
			message: 'Thresholds updated successfully',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Save complete settings object
	 */
	static async saveCompleteSettings(data: any): Promise<APIResponse> {
		// Update or create settings document
		const updateFields: any = {};
		
		// Handle thresholds
		if (data.thresholds) {
			if (data.thresholds.temperatureThreshold) updateFields.temperatureThreshold = data.thresholds.temperatureThreshold;
			if (data.thresholds.humidityThreshold) updateFields.humidityThreshold = data.thresholds.humidityThreshold;
			if (data.thresholds.soilMoistureThreshold) updateFields.soilMoistureThreshold = data.thresholds.soilMoistureThreshold;
			if (data.thresholds.waterLevelThreshold) updateFields.waterLevelThreshold = data.thresholds.waterLevelThreshold;
		}
		
		// Handle email settings
		if (data.emailAlerts) updateFields.emailAlerts = data.emailAlerts;
		if (data.emailRecipients !== undefined) updateFields['notifications.emailRecipients'] = data.emailRecipients;
		if (data.alertFrequency !== undefined) updateFields['notifications.alertFrequency'] = data.alertFrequency;
		if (data.batchAlerts !== undefined) updateFields['notifications.batchAlerts'] = data.batchAlerts;

		const updatedSettings = await Settings.findOneAndUpdate(
			{}, // Find any settings document (there should be only one)
			{ $set: updateFields },
			{ upsert: true, new: true }
		);

		// Broadcast setting updates via WebSocket if available
		if (data.thresholds && webSocketService) {
			webSocketService.broadcastThresholdUpdate(data.thresholds);
			webSocketService.broadcastDatabaseChange('Settings', 'update', {
				type: 'complete_settings',
				data: updatedSettings
			});
		}

		// Trigger AlertService to reload configuration if thresholds or email settings changed
		if (data.thresholds || data.emailAlerts || data.emailRecipients !== undefined) {
			try {
				await alertService.reloadThresholds();
				console.log('✅ AlertService configuration reloaded after complete settings update');
			} catch (error) {
				console.error('❌ Failed to reload AlertService configuration:', error);
			}
		}

		return {
			success: true,
			data: updatedSettings,
			message: 'Settings saved successfully',
			timestamp: new Date().toISOString()
		};
	}
}
