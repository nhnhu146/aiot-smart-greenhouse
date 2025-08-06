import { notificationService } from '../NotificationService';
import { emailService, AlertEmailData } from '../EmailService';
import { AlertCooldownManager } from './AlertCooldownManager';
import { AlertConfig } from './AlertConfig';
export class TemperatureChecker {
	private lastCheckedValues: Map<string, number> = new Map();
	async checkTemperature(
		value: number,
		traceId: string,
		config: AlertConfig,
		cooldownManager: AlertCooldownManager,
		pendingAlerts: any[]
	): Promise<void> {
		const thresholds = config.getCurrentThresholds();
		if (!thresholds) return;
		const threshold = thresholds.temperatureThreshold;
		const lastValue = this.lastCheckedValues.get('temperature');
		console.log(`[${traceId}] 🌡️ Checking temperature: ${value}°C (min: ${threshold.min}, max: ${threshold.max})`);
		// Only trigger if value changes significantly or crosses threshold
		if (lastValue !== undefined && Math.abs(value - lastValue) < 0.5) {
			console.log(`[${traceId}] 🌡️ Temperature change too small: ${value}°C vs last ${lastValue}°C`);
			return;
		}

		// Check if we need to alert and if not in cooldown
		const shouldAlert = value < threshold.min || value > threshold.max;
		if (shouldAlert && cooldownManager.isInCooldown('temperature')) {
			console.log(`[${traceId}] ⏰ Temperature alert in cooldown: ${cooldownManager.getCooldownRemaining('temperature')} minutes remaining`);
			this.lastCheckedValues.set('temperature', value);
			return;
		}

		if (value < threshold.min) {
			await this.handleLowTemperature(value, threshold, traceId, config, cooldownManager, pendingAlerts);
		} else if (value > threshold.max) {
			await this.handleHighTemperature(value, threshold, traceId, config, cooldownManager, pendingAlerts);
		} else {
			console.log(`✅ Temperature within range: ${value}°C`);
			cooldownManager.clearAlertTime('temperature');
		}

		this.lastCheckedValues.set('temperature', value);
	}

	private async handleLowTemperature(
		value: number,
		threshold: { min: number; max: number },
		traceId: string,
		config: AlertConfig,
		cooldownManager: AlertCooldownManager,
		pendingAlerts: any[]
	): Promise<void> {
		console.log(`[${traceId}] 🚨 [Temperature] BELOW threshold: ${value}°C < ${threshold.min}°C`);
		cooldownManager.setAlertTime('temperature');
		await notificationService.triggerAlert({
			type: 'temperature',
			level: value < threshold.min - 5 ? 'critical' : 'high',
			message: `Temperature too low: ${value}°C (minimum: ${threshold.min}°C)`,
			currentValue: value,
			threshold: threshold
		});
		await this.sendEmailAlert(
			{
				type: 'temperature',
				level: value < threshold.min - 5 ? 'critical' : 'high',
				message: `Temperature too low: ${value}°C (minimum: ${threshold.min}°C)`,
				currentValue: value,
				threshold: threshold,
				timestamp: new Date().toISOString()
			},
			'❄️ Smart Greenhouse - Low Temperature Alert',
			'Temperature',
			`${value}°C`,
			`Min: ${threshold.min}°C`,
			config,
			pendingAlerts
		);
	}

	private async handleHighTemperature(
		value: number,
		threshold: { min: number; max: number },
		traceId: string,
		config: AlertConfig,
		cooldownManager: AlertCooldownManager,
		pendingAlerts: any[]
	): Promise<void> {
		console.log(`[${traceId}] 🚨 [Temperature] ABOVE threshold: ${value}°C > ${threshold.max}°C`);
		cooldownManager.setAlertTime('temperature');
		await notificationService.triggerAlert({
			type: 'temperature',
			level: value > threshold.max + 5 ? 'critical' : 'high',
			message: `Temperature too high: ${value}°C (maximum: ${threshold.max}°C)`,
			currentValue: value,
			threshold: threshold
		});
		await this.sendEmailAlert(
			{
				type: 'temperature',
				level: value > threshold.max + 5 ? 'critical' : 'high',
				message: `Temperature too high: ${value}°C (maximum: ${threshold.max}°C)`,
				currentValue: value,
				threshold: threshold,
				timestamp: new Date().toISOString()
			},
			'🔥 Smart Greenhouse - High Temperature Alert',
			'Temperature',
			`${value}°C`,
			`Max: ${threshold.max}°C`,
			config,
			pendingAlerts
		);
	}

	private async sendEmailAlert(
		alert: any,
		subject: string,
		sensorType: string,
		currentValue: string,
		thresholdInfo: string,
		config: AlertConfig,
		pendingAlerts: any[]
	): Promise<void> {
		const emailRecipients = config.getEmailRecipients();
		const emailAlerts = config.getEmailAlerts();
		if (emailRecipients.length > 0 && emailAlerts.temperature) {
			if (config.isBatchAlertsEnabled()) {
				pendingAlerts.push(alert);
				console.log(`🔄 Temperature alert added to batch (${pendingAlerts.length} pending)`);
			} else {
				console.log(`📧 Sending temperature alert email to ${emailRecipients.length} recipients`);
				for (const recipient of emailRecipients) {
					const alertData: AlertEmailData = {
						alertType: subject,
						deviceType: sensorType,
						currentValue: parseFloat(currentValue.replace('°C', '')),
						threshold: alert.threshold?.max || alert.threshold?.min || 0,
						timestamp: new Date().toISOString(),
						severity: alert.level || 'medium'
					};
					await emailService.sendAlertEmail(alertData, [recipient]);
				}
			}
		}
	}
}
