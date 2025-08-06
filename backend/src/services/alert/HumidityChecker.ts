import { notificationService } from '../NotificationService';
import { emailService, AlertEmailData } from '../EmailService';
import { AlertConfig } from './AlertConfig';
import { AlertCooldownManager } from './AlertCooldownManager';
export class HumidityChecker {
	private lastCheckedValues: Map<string, number> = new Map();
	async checkHumidity(
		value: number,
		traceId: string,
		config: AlertConfig,
		cooldownManager: AlertCooldownManager,
		pendingAlerts: any[]
	): Promise<void> {
		const thresholds = config.getCurrentThresholds();
		if (!thresholds) return;
		const threshold = thresholds.humidityThreshold;
		const lastValue = this.lastCheckedValues.get('humidity');
		console.log(`[${traceId}] 💧 Checking humidity: ${value}% (min: ${threshold.min}, max: ${threshold.max})`);
		if (lastValue !== undefined && Math.abs(value - lastValue) < 2) {
			console.log(`[${traceId}] 💧 Humidity change too small: ${value}% vs last ${lastValue}%`);
			return;
		}

		if (value < threshold.min) {
			await this.handleLowHumidity(value, threshold, traceId, config, pendingAlerts);
		} else if (value > threshold.max) {
			await this.handleHighHumidity(value, threshold, traceId, config, pendingAlerts);
		} else {
			console.log(`✅ Humidity within range: ${value}%`);
		}

		this.lastCheckedValues.set('humidity', value);
	}

	private async handleLowHumidity(
		value: number,
		threshold: { min: number; max: number },
		traceId: string,
		config: AlertConfig,
		pendingAlerts: any[]
	): Promise<void> {
		console.log(`[${traceId}] 🚨 [Humidity] BELOW threshold: ${value}% < ${threshold.min}%`);
		await notificationService.triggerAlert({
			type: 'humidity',
			level: value < threshold.min - 10 ? 'high' : 'medium',
			message: `Humidity too low: ${value}% (minimum: ${threshold.min}%)`,
			currentValue: value,
			threshold: threshold
		});
		await this.sendEmailAlert(
			{
				type: 'humidity',
				level: value < threshold.min - 10 ? 'high' : 'medium',
				message: `Humidity too low: ${value}% (minimum: ${threshold.min}%)`,
				currentValue: value,
				threshold: threshold,
				timestamp: new Date().toISOString()
			},
			'💧 Smart Greenhouse - Low Humidity Alert',
			'Humidity',
			`${value}%`,
			`Min: ${threshold.min}%`,
			config,
			pendingAlerts
		);
	}

	private async handleHighHumidity(
		value: number,
		threshold: { min: number; max: number },
		traceId: string,
		config: AlertConfig,
		pendingAlerts: any[]
	): Promise<void> {
		console.log(`[${traceId}] 🚨 [Humidity] ABOVE threshold: ${value}% > ${threshold.max}%`);
		await notificationService.triggerAlert({
			type: 'humidity',
			level: value > threshold.max + 10 ? 'high' : 'medium',
			message: `Humidity too high: ${value}% (maximum: ${threshold.max}%)`,
			currentValue: value,
			threshold: threshold
		});
		await this.sendEmailAlert(
			{
				type: 'humidity',
				level: value > threshold.max + 10 ? 'high' : 'medium',
				message: `Humidity too high: ${value}% (maximum: ${threshold.max}%)`,
				currentValue: value,
				threshold: threshold,
				timestamp: new Date().toISOString()
			},
			'💨 Smart Greenhouse - High Humidity Alert',
			'Humidity',
			`${value}%`,
			`Max: ${threshold.max}%`,
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
		if (emailRecipients.length > 0 && emailAlerts.humidity) {
			if (config.isBatchAlertsEnabled()) {
				pendingAlerts.push(alert);
				console.log(`🔄 Humidity alert added to batch (${pendingAlerts.length} pending)`);
			} else {
				console.log(`📧 Sending humidity alert email to ${emailRecipients.length} recipients`);
				for (const recipient of emailRecipients) {
					const alertData: AlertEmailData = {
						alertType: subject,
						deviceType: sensorType,
						currentValue: parseFloat(currentValue.replace('%', '')),
						threshold: alert.threshold?.max || 0,
						timestamp: new Date().toISOString(),
						severity: alert.level || 'medium'
					};
					await emailService.sendAlertEmail(alertData, [recipient]);
				}
			}
		}
	}
}
