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

		const thresholds = config.getCurrentThresholds();
		if (!thresholds) {
			console.warn(`[${traceId}] ⚠️ No thresholds configured for soil moisture check`);
			return;
		}

		const triggerValue = thresholds.soilMoistureThreshold.trigger;
		console.log(`[${traceId}] 🌱 Soil moisture trigger value: ${triggerValue} (${triggerValue === 0 ? 'Alert on DRY' : 'Alert on WET'})`);

		// Check cooldown period - prevent spam alerts
		if (value === triggerValue && cooldownManager.isInCooldown('soilMoisture')) {
			console.log(`[${traceId}] ⏰ Soil moisture alert in cooldown: ${cooldownManager.getCooldownRemaining('soilMoisture')} minutes remaining`);
			this.lastCheckedValues.set('soilMoisture', value);
			return;
		}

		// Alert when sensor value matches trigger value
		if (value === triggerValue) {
			const alertMsg = triggerValue === 0
				? 'Soil moisture is DRY (0) - Plants need watering immediately'
				: 'Soil moisture is WET (1) - Check for overwatering or drainage issues';

			console.log(`[${traceId}] 🚨 [Soil Moisture] ${triggerValue === 0 ? 'DRY' : 'WET'} - Trigger matched!`);
			cooldownManager.setAlertTime('soilMoisture');

			await notificationService.triggerAlert({
				type: 'soilMoisture',
				level: triggerValue === 0 ? 'high' : 'medium',
				message: alertMsg,
				currentValue: value,
				threshold: { min: triggerValue, max: triggerValue }
			});
			await this.sendSoilMoistureEmailAlert(config, pendingAlerts, value, triggerValue);
		} else {
			const okMsg = triggerValue === 0
				? '✅ Soil moisture is WET (1) - Plants are well watered'
				: '✅ Soil moisture is DRY (0) - Normal moisture level';
			console.log(okMsg);
			cooldownManager.clearAlertTime('soilMoisture');
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
		console.log(`[${traceId}] 🚰 Checking water level: ${value === 1 ? 'FULL (1)' : 'EMPTY (0)'}`);

		// Check if value actually changed
		if (lastValue !== undefined && lastValue === value) {
			console.log(`[${traceId}] 🚰 Water level unchanged: ${value === 1 ? 'FULL' : 'EMPTY'}`);
			return;
		}

		const thresholds = config.getCurrentThresholds();
		if (!thresholds) {
			console.warn(`[${traceId}] ⚠️ No thresholds configured for water level check`);
			return;
		}

		const triggerValue = thresholds.waterLevelThreshold.trigger;
		console.log(`[${traceId}] 🚰 Water level trigger value: ${triggerValue} (${triggerValue === 0 ? 'Alert on EMPTY' : 'Alert on FULL'})`);

		// Check cooldown period - prevent spam alerts
		if (value === triggerValue && cooldownManager.isInCooldown('waterLevel')) {
			console.log(`[${traceId}] ⏰ Water level alert in cooldown: ${cooldownManager.getCooldownRemaining('waterLevel')} minutes remaining`);
			this.lastCheckedValues.set('waterLevel', value);
			return;
		}

		// Alert when sensor value matches trigger value
		if (value === triggerValue) {
			const alertMsg = triggerValue === 0
				? 'Water level is EMPTY (0) - Refill water tank immediately'
				: 'Water level is FULL (1) - Check for overflow or sensor malfunction';

			console.log(`[${traceId}] 🚨 [Water Level] ${triggerValue === 0 ? 'EMPTY' : 'FULL'} - Trigger matched!`);
			cooldownManager.setAlertTime('waterLevel');

			await notificationService.triggerAlert({
				type: 'waterLevel',
				level: triggerValue === 0 ? 'critical' : 'medium',
				message: alertMsg,
				currentValue: value,
				threshold: { min: triggerValue, max: triggerValue }
			});
			await this.sendWaterLevelEmailAlert(config, pendingAlerts, value, triggerValue);
		} else {
			const okMsg = triggerValue === 0
				? '✅ Water level is FULL (1) - Water tank has water'
				: '✅ Water level is EMPTY (0) - Normal empty state';
			console.log(okMsg);
			cooldownManager.clearAlertTime('waterLevel');
		}

		this.lastCheckedValues.set('waterLevel', value);
	}

	private async sendSoilMoistureEmailAlert(config: AlertConfig, pendingAlerts: any[], currentValue: number, triggerValue: number): Promise<void> {
		const emailRecipients = config.getEmailRecipients();
		const emailAlerts = config.getEmailAlerts();
		if (emailRecipients.length > 0 && emailAlerts.soilMoisture) {
			const alertType = triggerValue === 0 ? 'Dry Soil Alert' : 'Wet Soil Alert';
			const message = triggerValue === 0
				? 'Soil moisture is DRY (0) - Plants need watering immediately'
				: 'Soil moisture is WET (1) - Check for overwatering or drainage issues';

			const alert = {
				type: 'soilMoisture',
				level: triggerValue === 0 ? 'high' : 'medium',
				message,
				currentValue,
				threshold: { min: triggerValue, max: triggerValue },
				timestamp: new Date().toISOString()
			};

			if (config.isBatchAlertsEnabled()) {
				pendingAlerts.push(alert);
				console.log(`🔄 Soil moisture alert added to batch (${pendingAlerts.length} pending)`);
			} else {
				console.log(`📧 Sending soil moisture alert email to ${emailRecipients.length} recipients`);
				for (const recipient of emailRecipients) {
					const alertData: AlertEmailData = {
						alertType,
						deviceType: 'Soil Moisture',
						currentValue,
						threshold: triggerValue,
						timestamp: new Date().toISOString(),
						severity: triggerValue === 0 ? 'high' : 'medium'
					};
					await emailService.sendAlertEmail(alertData, [recipient]);
				}
			}
		}
	}

	private async sendWaterLevelEmailAlert(config: AlertConfig, pendingAlerts: any[], currentValue: number, triggerValue: number): Promise<void> {
		const emailRecipients = config.getEmailRecipients();
		const emailAlerts = config.getEmailAlerts();
		if (emailRecipients.length > 0 && emailAlerts.waterLevel) {
			const alertType = triggerValue === 0 ? 'Empty Water Tank Alert' : 'Full Water Tank Alert';
			const message = triggerValue === 0
				? 'Water level is EMPTY (0) - Refill water tank immediately'
				: 'Water level is FULL (1) - Check for overflow or sensor malfunction';

			const alert = {
				type: 'waterLevel',
				level: triggerValue === 0 ? 'critical' : 'medium',
				message,
				currentValue,
				threshold: { min: triggerValue, max: triggerValue },
				timestamp: new Date().toISOString()
			};

			if (config.isBatchAlertsEnabled()) {
				pendingAlerts.push(alert);
				console.log(`🔄 Water level alert added to batch (${pendingAlerts.length} pending)`);
			} else {
				console.log(`📧 Sending water level alert email to ${emailRecipients.length} recipients`);
				for (const recipient of emailRecipients) {
					const alertData: AlertEmailData = {
						alertType,
						deviceType: 'Water Level',
						currentValue,
						threshold: triggerValue,
						timestamp: new Date().toISOString(),
						severity: triggerValue === 0 ? 'critical' : 'medium'
					};
					await emailService.sendAlertEmail(alertData, [recipient]);
				}
			}
		}
	}
}
