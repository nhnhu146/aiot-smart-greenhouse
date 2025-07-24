import { Settings, SensorData } from '../models';
import { notificationService, AlertData } from './NotificationService';
import { emailService } from './EmailService';

export interface ThresholdConfig {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { min: number; max: number };
	waterLevelThreshold: { min: number; max: number };
}

export interface EmailAlertsConfig {
	temperature: boolean;
	humidity: boolean;
	soilMoisture: boolean;
	waterLevel: boolean;
}

class AlertService {
	private currentThresholds: ThresholdConfig | null = null;
	private lastCheckedValues: Map<string, number> = new Map();
	private lastAlertTimes: Map<string, number> = new Map(); // Track last alert time for each sensor
	private alertCooldownMs: number = 5 * 60 * 1000; // 5 minutes cooldown between same alerts
	private emailRecipients: string[] = [];
	private emailAlerts: EmailAlertsConfig = {
		temperature: true,
		humidity: true,
		soilMoisture: true,
		waterLevel: true
	};

	// Batch alert properties
	private pendingAlerts: any[] = [];
	private batchAlertTimer: NodeJS.Timeout | null = null;
	private alertFrequency: number = 5; // minutes
	private batchAlerts: boolean = true;

	constructor() {
		this.loadThresholds();
		this.loadEmailRecipients();
		this.startBatchAlertTimer();
	}

	// Load email recipients and email alert settings from database
	async loadEmailRecipients(): Promise<void> {
		try {
			const settings = await Settings.findOne().lean();
			if (settings && settings.notifications?.emailRecipients) {
				this.emailRecipients = settings.notifications.emailRecipients;
				console.log(`📧 Email recipients loaded: ${this.emailRecipients.length} recipients`);
			} else {
				console.log('⚠️ No email recipients configured');
				this.emailRecipients = [];
			}

			// Load email alert settings
			if (settings && settings.emailAlerts) {
				this.emailAlerts = settings.emailAlerts;
				console.log('📧 Email alert settings loaded:', this.emailAlerts);
			} else {
				console.log('⚠️ No email alert settings found, using defaults');
			}

			// Load alert frequency and batch settings
			if (settings && settings.notifications) {
				this.alertFrequency = (settings.notifications as any).alertFrequency || 5;
				this.batchAlerts = (settings.notifications as any).batchAlerts !== false;
				console.log(`⏰ Alert frequency: ${this.alertFrequency} minutes, Batch: ${this.batchAlerts}`);
			}
		} catch (error) {
			console.error('❌ Error loading email recipients and alert settings:', error);
			this.emailRecipients = [];
		}
	}

	// Load thresholds from database
	async loadThresholds(): Promise<void> {
		try {
			const settings = await Settings.findOne().lean();
			if (settings) {
				this.currentThresholds = {
					temperatureThreshold: settings.temperatureThreshold,
					humidityThreshold: settings.humidityThreshold,
					soilMoistureThreshold: settings.soilMoistureThreshold,
					waterLevelThreshold: settings.waterLevelThreshold
				};
				console.log('⚙️ Alert thresholds loaded:', this.currentThresholds);
			} else {
				console.log('⚠️ No settings found, using default thresholds');
				this.setDefaultThresholds();
			}
		} catch (error) {
			console.error('❌ Error loading thresholds:', error);
			this.setDefaultThresholds();
		}
	}

	private setDefaultThresholds(): void {
		this.currentThresholds = {
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 0, max: 0 }, // Binary: No threshold - always alert when dry (0)
			waterLevelThreshold: { min: 20, max: 90 }
		};
		console.log('🔧 Using default thresholds (Soil Moisture: No threshold):', this.currentThresholds);
	}

	// Main function to check all sensor thresholds
	async checkSensorThresholds(sensorData: {
		temperature: number;
		humidity: number;
		soilMoisture: number;
		waterLevel: number;
	}): Promise<void> {
		const traceId = Math.random().toString(36).substr(2, 9);
		console.log(`[${traceId}] 👀 Checking thresholds for data:`, sensorData);

		if (!this.currentThresholds) {
			await this.loadThresholds();
		}

		if (!this.currentThresholds) {
			console.error(`[${traceId}] ❌ No thresholds available for checking`);
			return;
		}

		console.log(`[${traceId}] 📊 Current thresholds:`, this.currentThresholds);

		// Sequential execution to avoid duplicate alerts
		await this.checkTemperature(sensorData.temperature, traceId);
		await this.checkHumidity(sensorData.humidity, traceId);
		await this.checkSoilMoisture(sensorData.soilMoisture, traceId);
		await this.checkWaterLevel(sensorData.waterLevel, traceId);
	}

	// Helper method to check cooldown for any sensor
	private isInCooldown(sensorType: string): boolean {
		const lastAlertTime = this.lastAlertTimes.get(sensorType) || 0;
		const now = Date.now();
		return (now - lastAlertTime) < this.alertCooldownMs;
	}

	// Helper method to get remaining cooldown time in minutes
	private getCooldownRemaining(sensorType: string): number {
		const lastAlertTime = this.lastAlertTimes.get(sensorType) || 0;
		const now = Date.now();
		return Math.ceil((this.alertCooldownMs - (now - lastAlertTime)) / 1000 / 60);
	}

	// Helper method to set alert time
	private setAlertTime(sensorType: string): void {
		this.lastAlertTimes.set(sensorType, Date.now());
	}

	// Helper method to clear alert time when sensor returns to normal
	private clearAlertTime(sensorType: string): void {
		this.lastAlertTimes.delete(sensorType);
	}

	private async checkTemperature(value: number, traceId: string): Promise<void> {
		if (!this.currentThresholds) return;

		const threshold = this.currentThresholds.temperatureThreshold;
		const lastValue = this.lastCheckedValues.get('temperature');

		console.log(`[${traceId}] 🌡️ Checking temperature: ${value}°C (min: ${threshold.min}, max: ${threshold.max})`);

		// Only trigger if value changes significantly or crosses threshold
		if (lastValue !== undefined && Math.abs(value - lastValue) < 0.5) {
			console.log(`[${traceId}] 🌡️ Temperature change too small: ${value}°C vs last ${lastValue}°C`);
			return;
		}

		// Check if we need to alert and if not in cooldown
		const shouldAlert = value < threshold.min || value > threshold.max;
		if (shouldAlert && this.isInCooldown('temperature')) {
			console.log(`[${traceId}] ⏰ Temperature alert in cooldown: ${this.getCooldownRemaining('temperature')} minutes remaining`);
			this.lastCheckedValues.set('temperature', value);
			return;
		}

		if (value < threshold.min) {
			console.log(`[${traceId}] 🚨 [Temperature] BELOW threshold: ${value}°C < ${threshold.min}°C`);
			this.setAlertTime('temperature');

			await notificationService.triggerAlert({
				type: 'temperature',
				level: value < threshold.min - 5 ? 'critical' : 'high',
				message: `Temperature too low: ${value}°C (minimum: ${threshold.min}°C)`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0 && this.emailAlerts.temperature) {
				const alert = {
					type: 'temperature',
					level: value < threshold.min - 5 ? 'critical' : 'high',
					message: `Temperature too low: ${value}°C (minimum: ${threshold.min}°C)`,
					currentValue: value,
					threshold: threshold,
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Temperature alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					console.log(`📧 Sending temperature alert email to ${this.emailRecipients.length} recipients`);
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'❄️ Smart Greenhouse - Low Temperature Alert',
							'Temperature',
							`${value}°C`,
							`Min: ${threshold.min}°C`
						);
					}
				}
			}
		} else if (value > threshold.max) {
			console.log(`[${traceId}] 🚨 [Temperature] ABOVE threshold: ${value}°C > ${threshold.max}°C`);
			this.setAlertTime('temperature');

			await notificationService.triggerAlert({
				type: 'temperature',
				level: value > threshold.max + 5 ? 'critical' : 'high',
				message: `Temperature too high: ${value}°C (maximum: ${threshold.max}°C)`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0 && this.emailAlerts.temperature) {
				const alert = {
					type: 'temperature',
					level: value > threshold.max + 5 ? 'critical' : 'high',
					message: `Temperature too high: ${value}°C (maximum: ${threshold.max}°C)`,
					currentValue: value,
					threshold: threshold,
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Temperature alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					console.log(`📧 Sending temperature alert email to ${this.emailRecipients.length} recipients`);
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'🔥 Smart Greenhouse - High Temperature Alert',
							'Temperature',
							`${value}°C`,
							`Max: ${threshold.max}°C`
						);
					}
				}
			}
		} else {
			console.log(`✅ Temperature within range: ${value}°C`);
			// Clear alert time when temperature returns to normal range
			this.clearAlertTime('temperature');
		}

		this.lastCheckedValues.set('temperature', value);
	}

	private async checkHumidity(value: number, traceId: string): Promise<void> {
		if (!this.currentThresholds) return;

		const threshold = this.currentThresholds.humidityThreshold;
		const lastValue = this.lastCheckedValues.get('humidity');

		console.log(`[${traceId}] 💧 Checking humidity: ${value}% (min: ${threshold.min}, max: ${threshold.max})`);

		if (lastValue !== undefined && Math.abs(value - lastValue) < 2) {
			console.log(`[${traceId}] 💧 Humidity change too small: ${value}% vs last ${lastValue}%`);
			return;
		}

		if (value < threshold.min) {
			console.log(`[${traceId}] 🚨 [Humidity] BELOW threshold: ${value}% < ${threshold.min}%`);
			await notificationService.triggerAlert({
				type: 'humidity',
				level: value < threshold.min - 10 ? 'high' : 'medium',
				message: `Humidity too low: ${value}% (minimum: ${threshold.min}%)`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0 && this.emailAlerts.humidity) {
				const alert = {
					type: 'humidity',
					level: value < threshold.min - 10 ? 'high' : 'medium',
					message: `Humidity too low: ${value}% (minimum: ${threshold.min}%)`,
					currentValue: value,
					threshold: threshold,
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Humidity alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					console.log(`📧 Sending humidity alert email to ${this.emailRecipients.length} recipients`);
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'💧 Smart Greenhouse - Low Humidity Alert',
							'Humidity',
							`${value}%`,
							`Min: ${threshold.min}%`
						);
					}
				}
			}
		} else if (value > threshold.max) {
			console.log(`[${traceId}] 🚨 [Humidity] ABOVE threshold: ${value}% > ${threshold.max}%`);
			await notificationService.triggerAlert({
				type: 'humidity',
				level: value > threshold.max + 10 ? 'high' : 'medium',
				message: `Humidity too high: ${value}% (maximum: ${threshold.max}%)`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0 && this.emailAlerts.humidity) {
				const alert = {
					type: 'humidity',
					level: value > threshold.max + 10 ? 'high' : 'medium',
					message: `Humidity too high: ${value}% (maximum: ${threshold.max}%)`,
					currentValue: value,
					threshold: threshold,
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Humidity alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					console.log(`📧 Sending humidity alert email to ${this.emailRecipients.length} recipients`);
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'💨 Smart Greenhouse - High Humidity Alert',
							'Humidity',
							`${value}%`,
							`Max: ${threshold.max}%`
						);
					}
				}
			}
		} else {
			console.log(`✅ Humidity within range: ${value}%`);
		}

		this.lastCheckedValues.set('humidity', value);
	}

	private async checkSoilMoisture(value: number, traceId: string): Promise<void> {
		const lastValue = this.lastCheckedValues.get('soilMoisture');
		const lastAlertTime = this.lastAlertTimes.get('soilMoisture') || 0;
		const now = Date.now();

		// Soil moisture is binary: 1 = wet, 0 = dry
		// NO THRESHOLD CHECKS - Always alert when dry (0)
		console.log(`[${traceId}] 🌱 Checking soil moisture: ${value === 1 ? 'WET (1)' : 'DRY (0)'}`);

		// Check if value actually changed
		if (lastValue !== undefined && lastValue === value) {
			console.log(`[${traceId}] 🌱 Soil moisture unchanged: ${value === 1 ? 'WET' : 'DRY'}`);
			return;
		}

		// Check cooldown period - prevent spam alerts
		if (value === 0 && (now - lastAlertTime) < this.alertCooldownMs) {
			const remainingCooldown = Math.ceil((this.alertCooldownMs - (now - lastAlertTime)) / 1000 / 60);
			console.log(`[${traceId}] ⏰ Soil moisture alert in cooldown: ${remainingCooldown} minutes remaining`);
			this.lastCheckedValues.set('soilMoisture', value); // Update value but skip alert
			return;
		}

		// Alert when soil is dry (value = 0) - NO THRESHOLD NEEDED
		if (value === 0) {
			console.log(`[${traceId}] 🚨 [Soil Moisture] DRY - Plants need watering! (Default alert)`);

			// Update alert time to prevent duplicates
			this.lastAlertTimes.set('soilMoisture', now);

			await notificationService.triggerAlert({
				type: 'soilMoisture',
				level: 'high',
				message: `Soil moisture is DRY (0) - Plants need watering immediately`,
				currentValue: value,
				threshold: null // No threshold for binary soil moisture
			});

			// Send email alert if enabled - ALWAYS for dry soil
			if (this.emailRecipients.length > 0 && this.emailAlerts.soilMoisture) {
				const alert = {
					type: 'soilMoisture',
					level: 'high',
					message: `Soil moisture is DRY (0) - Plants need watering immediately`,
					currentValue: value,
					threshold: null, // No threshold configuration
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Soil moisture alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					console.log(`📧 Sending soil moisture alert email to ${this.emailRecipients.length} recipients`);
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'🌱 Smart Greenhouse - Dry Soil Alert',
							'Soil Moisture',
							'Dry (Default Alert)',
							'Auto-alert when dry'
						);
					}
				}
			}
		} else if (value === 1) {
			console.log(`✅ Soil moisture is WET (1) - Plants are well watered`);
			// Clear alert time when soil becomes wet again
			this.lastAlertTimes.delete('soilMoisture');
		} else {
			console.log(`[${traceId}] ⚠️ Unexpected soil moisture value: ${value}`);
		}

		this.lastCheckedValues.set('soilMoisture', value);
	}

	private async checkWaterLevel(value: number, traceId: string): Promise<void> {
		if (!this.currentThresholds) return;

		const threshold = this.currentThresholds.waterLevelThreshold;
		const lastValue = this.lastCheckedValues.get('waterLevel');

		console.log(`[${traceId}] 🚰 Checking water level: ${value}% (min: ${threshold.min}, max: ${threshold.max})`);

		if (lastValue !== undefined && Math.abs(value - lastValue) < 2) {
			console.log(`[${traceId}] 🚰 Water level change too small: ${value}% vs last ${lastValue}%`);
			return;
		}

		if (value < threshold.min) {
			console.log(`[${traceId}] 🚨 [Water Level] BELOW threshold: ${value}% < ${threshold.min}%`);
			await notificationService.triggerAlert({
				type: 'waterLevel',
				level: value < 10 ? 'critical' : 'high',
				message: `Water level too low: ${value}% (minimum: ${threshold.min}%) - Refill water tank`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0 && this.emailAlerts.waterLevel) {
				const alert = {
					type: 'waterLevel',
					level: value < 10 ? 'critical' : 'high',
					message: `Water level too low: ${value}% (minimum: ${threshold.min}%) - Refill water tank`,
					currentValue: value,
					threshold: threshold,
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Water level alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					console.log(`📧 Sending water level alert email to ${this.emailRecipients.length} recipients`);
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'💧 Smart Greenhouse - Low Water Level Alert',
							'Water Level',
							`${value}%`,
							`Min: ${threshold.min}%`
						);
					}
				}
			}
		} else {
			console.log(`✅ Water level within range: ${value}%`);
		}

		this.lastCheckedValues.set('waterLevel', value);
	}

	// Method to update thresholds from frontend
	async updateThresholds(newThresholds: Partial<ThresholdConfig>): Promise<void> {
		try {
			if (this.currentThresholds) {
				this.currentThresholds = { ...this.currentThresholds, ...newThresholds };
			}
			console.log('Thresholds updated:', newThresholds);
		} catch (error) {
			console.error('Error updating thresholds:', error);
		}
	}

	// Get current thresholds
	getCurrentThresholds(): ThresholdConfig | null {
		return this.currentThresholds;
	}

	// Force reload thresholds from database (useful when settings change)
	async reloadThresholds(): Promise<void> {
		await this.loadThresholds();
		await this.loadEmailRecipients();

		// Restart batch alert timer with new settings
		this.startBatchAlertTimer();
	}

	// Handle motion detection alert
	async handleMotionDetected(): Promise<void> {
		try {
			await notificationService.triggerAlert({
				type: 'motion',
				level: 'medium',
				message: 'Motion detected in greenhouse - Door automatically opened',
				currentValue: 1,
				threshold: { min: 0, max: 1 }
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0) {
				const alert = {
					type: 'motion',
					level: 'medium',
					message: 'Motion detected in greenhouse - Door automatically opened',
					currentValue: 1,
					threshold: { min: 0, max: 1 },
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 Motion alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'👁️ Smart Greenhouse - Motion Detected',
							'Motion Sensor',
							'Motion Detected',
							'Security Alert'
						);
					}
				}
			}
		} catch (error) {
			console.error('Error handling motion detection alert:', error);
		}
	}

	// Handle system errors
	async handleSystemError(error: string, component: string): Promise<void> {
		try {
			await notificationService.triggerAlert({
				type: 'system',
				level: 'critical',
				message: `System error in ${component}: ${error}`,
				currentValue: 0,
				threshold: { min: 0, max: 0 }
			});

			// Send email alert if enabled
			if (this.emailRecipients.length > 0) {
				const alert = {
					type: 'system',
					level: 'critical',
					message: `System error in ${component}: ${error}`,
					currentValue: 0,
					threshold: { min: 0, max: 0 },
					timestamp: new Date().toISOString()
				};

				// Add to pending alerts if batching enabled
				if (this.batchAlerts) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 System error alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					// Send immediately if not batching
					for (const recipient of this.emailRecipients) {
						await emailService.sendAlertEmail(
							recipient,
							'⚠️ Smart Greenhouse - System Error',
							'System Error',
							error,
							`Component: ${component}`
						);
					}
				}
			}
		} catch (error) {
			console.error('Error handling system error alert:', error);
		}
	}

	// Test email functionality
	async testEmailAlert(): Promise<boolean> {
		if (this.emailRecipients.length === 0) {
			console.log('No email recipients configured for testing');
			return false;
		}

		// Send test email to all recipients
		for (const recipient of this.emailRecipients) {
			await emailService.sendTestEmail(recipient);
		}
		return true;
	}

	// Get email service status
	getEmailStatus(): { enabled: boolean; configured: boolean; recipients: number } {
		const status = emailService.getStatus();
		return {
			enabled: status.configured,
			configured: status.configured,
			recipients: this.emailRecipients.length
		};
	}

	// Process batched alerts and send summary email
	private async processBatchedAlerts(): Promise<void> {
		if (this.pendingAlerts.length === 0) {
			console.log('📧 No pending alerts to process');
			return;
		}

		try {
			console.log(`📧 Processing ${this.pendingAlerts.length} batched alerts`);

			// Group alerts by type and level
			const alertSummary = this.groupAlertsByType(this.pendingAlerts);

			// Send batch email to all recipients
			for (const recipient of this.emailRecipients) {
				await emailService.sendBatchAlertEmail(recipient, alertSummary);
			}

			console.log(`📧 Batch alert email sent to ${this.emailRecipients.length} recipients`);

			// Clear pending alerts after sending
			this.pendingAlerts = [];

		} catch (error) {
			console.error('❌ Error processing batched alerts:', error);
		}
	}

	// Group alerts by type for summary
	private groupAlertsByType(alerts: any[]) {
		const summary = {
			totalAlerts: alerts.length,
			criticalCount: 0,
			highCount: 0,
			mediumCount: 0,
			lowCount: 0,
			alerts: alerts,
			timestamp: new Date().toISOString()
		};

		alerts.forEach(alert => {
			switch (alert.level) {
				case 'critical':
					summary.criticalCount++;
					break;
				case 'high':
					summary.highCount++;
					break;
				case 'medium':
					summary.mediumCount++;
					break;
				default:
					summary.lowCount++;
			}
		});

		return summary;
	}

	// Start batch alert timer
	private startBatchAlertTimer(): void {
		if (!this.batchAlerts) {
			console.log('📧 Batch alerts disabled, skipping timer');
			return;
		}

		// Clear existing timer
		if (this.batchAlertTimer) {
			clearInterval(this.batchAlertTimer);
		}

		// Set new timer
		const intervalMs = this.alertFrequency * 60 * 1000;
		this.batchAlertTimer = setInterval(() => {
			this.processBatchedAlerts();
		}, intervalMs);

		console.log(`⏰ Batch alert timer started: ${this.alertFrequency} minute intervals`);
	}
}

export const alertService = new AlertService();
export { AlertService };
