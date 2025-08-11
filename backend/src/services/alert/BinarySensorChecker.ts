import { emailService, AlertEmailData } from '../EmailService';
import { notificationService } from '../notification';
import { AlertConfig } from './AlertConfig';
import { AlertCooldownManager } from './AlertCooldownManager';
export class BinarySensorChecker {
	private lastCheckedValues: Map<string, number> = new Map();
	async checkSoilMoisture(
		value: number,
		traceId: string,
		config: AlertConfig,
		cooldownManager: AlertCooldownManager,
		pendingAlerts: any[]
	): Promise<void> {
		const lastValue = this.lastCheckedValues.get('soilMoisture');
		console.log(`[${traceId}] 🌱 Checking soil moisture: ${value === 1 ? 'WET (1)' : 'DRY (0)'}`);
		// Check if value actually changed
		if (lastValue !== undefined && lastValue === value) {
			console.log(`[${traceId}] 🌱 Soil moisture unchanged: ${value === 1 ? 'WET' : 'DRY'}`);
			return;
		}

		// Check cooldown period - prevent spam alerts
		if (value === 0 && cooldownManager.isInCooldown('soilMoisture')) {
			console.log(`[${traceId}] ⏰ Soil moisture alert in cooldown: ${cooldownManager.getCooldownRemaining('soilMoisture')} minutes remaining`);
			this.lastCheckedValues.set('soilMoisture', value);
			return;
		}

		// Alert when soil is dry (value = 0)
		if (value === 0) {
			console.log(`[${traceId}] 🚨 [Soil Moisture] DRY - Plants need watering!`);
			cooldownManager.setAlertTime('soilMoisture');
			await notificationService.triggerAlert({
				type: 'soilMoisture',
				level: 'high',
				message: 'Soil moisture is DRY (0) - Plants need watering immediately',
				currentValue: value,
				threshold: null
			});
			await this.sendSoilMoistureEmailAlert(config, pendingAlerts);
		} else if (value === 1) {
			console.log('✅ Soil moisture is WET (1) - Plants are well watered');
			cooldownManager.clearAlertTime('soilMoisture');
		} else {
			console.log(`[${traceId}] ⚠️ Unexpected soil moisture value: ${value}`);
		}

		this.lastCheckedValues.set('soilMoisture', value);
	}

	async checkWaterLevel(
		value: number,
		traceId: string,
		config: AlertConfig,
		cooldownManager: AlertCooldownManager,
		pendingAlerts: any[]
	): Promise<void> {
		const lastValue = this.lastCheckedValues.get('waterLevel');
		console.log(`[${traceId}] 🚰 Checking water level: ${value === 1 ? 'FULL (1)' : 'NONE (0)'}`);
		// Check if value actually changed
		if (lastValue !== undefined && lastValue === value) {
			console.log(`[${traceId}] 🚰 Water level unchanged: ${value === 1 ? 'FULL' : 'NONE'}`);
			return;
		}

		// Check cooldown period - prevent spam alerts
		if (value === 0 && cooldownManager.isInCooldown('waterLevel')) {
			console.log(`[${traceId}] ⏰ Water level alert in cooldown: ${cooldownManager.getCooldownRemaining('waterLevel')} minutes remaining`);
			this.lastCheckedValues.set('waterLevel', value);
			return;
		}

		// Alert when water level is empty (value = 0)
		if (value === 0) {
			console.log(`[${traceId}] 🚨 [Water Level] NONE - Water tank is empty!`);
			cooldownManager.setAlertTime('waterLevel');
			await notificationService.triggerAlert({
				type: 'waterLevel',
				level: 'critical',
				message: 'Water level is NONE (0) - Refill water tank immediately',
				currentValue: value,
				threshold: null
			});
			await this.sendWaterLevelEmailAlert(config, pendingAlerts);
		} else if (value === 1) {
			console.log('✅ Water level is FULL (1) - Water tank has water');
			cooldownManager.clearAlertTime('waterLevel');
		} else {
			console.log(`[${traceId}] ⚠️ Unexpected water level value: ${value}`);
		}

		this.lastCheckedValues.set('waterLevel', value);
	}

	private async sendSoilMoistureEmailAlert(config: AlertConfig, pendingAlerts: any[]): Promise<void> {
		const emailRecipients = config.getEmailRecipients();
		const emailAlerts = config.getEmailAlerts();
		if (emailRecipients.length > 0 && emailAlerts.soilMoisture) {
			const alert = {
				type: 'soilMoisture',
				level: 'high',
				message: 'Soil moisture is DRY (0) - Plants need watering immediately',
				currentValue: 0,
				threshold: null,
				timestamp: new Date().toISOString()
			};
			if (config.isBatchAlertsEnabled()) {
				pendingAlerts.push(alert);
				console.log(`🔄 Soil moisture alert added to batch (${pendingAlerts.length} pending)`);
			} else {
				console.log(`📧 Sending soil moisture alert email to ${emailRecipients.length} recipients`);
				for (const recipient of emailRecipients) {
					const alertData: AlertEmailData = {
						alertType: 'Dry Soil Alert',
						deviceType: 'Soil Moisture',
						currentValue: 0,
						threshold: 1,
						timestamp: new Date().toISOString(),
						severity: 'high'
					};
					await emailService.sendAlertEmail(alertData, [recipient]);
				}
			}
		}
	}

	private async sendWaterLevelEmailAlert(config: AlertConfig, pendingAlerts: any[]): Promise<void> {
		const emailRecipients = config.getEmailRecipients();
		const emailAlerts = config.getEmailAlerts();
		if (emailRecipients.length > 0 && emailAlerts.waterLevel) {
			const alert = {
				type: 'waterLevel',
				level: 'critical',
				message: 'Water level is NONE (0) - Refill water tank immediately',
				currentValue: 0,
				threshold: null,
				timestamp: new Date().toISOString()
			};
			if (config.isBatchAlertsEnabled()) {
				pendingAlerts.push(alert);
				console.log(`🔄 Water level alert added to batch (${pendingAlerts.length} pending)`);
			} else {
				console.log(`📧 Sending water level alert email to ${emailRecipients.length} recipients`);
				for (const recipient of emailRecipients) {
					const alertData: AlertEmailData = {
						alertType: 'Empty Water Tank Alert',
						deviceType: 'Water Level',
						currentValue: 0,
						threshold: 1,
						timestamp: new Date().toISOString(),
						severity: 'critical'
					};
					await emailService.sendAlertEmail(alertData, [recipient]);
				}
			}
		}
	}
}
