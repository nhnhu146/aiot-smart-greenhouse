import { Settings, SensorData } from '../models';
import { notificationService, AlertData } from './NotificationService';
import { emailService } from './EmailService';

export interface ThresholdConfig {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { min: number; max: number };
	waterLevelThreshold: { min: number; max: number };
}

class AlertService {
	private currentThresholds: ThresholdConfig | null = null;
	private lastCheckedValues: Map<string, number> = new Map();
	private emailRecipients: string[] = [];

	constructor() {
		this.loadThresholds();
		this.loadEmailRecipients();
	}

	// Load email recipients from settings
	async loadEmailRecipients(): Promise<void> {
		try {
			const settings = await Settings.findOne().lean();
			if (settings && settings.notifications?.emailRecipients) {
				this.emailRecipients = settings.notifications.emailRecipients;
				console.log(`Email recipients loaded: ${this.emailRecipients.length} recipients`);
			} else {
				console.log('No email recipients configured');
				this.emailRecipients = [];
			}
		} catch (error) {
			console.error('Error loading email recipients:', error);
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
				console.log('Alert thresholds loaded:', this.currentThresholds);
			} else {
				console.log('No settings found, using default thresholds');
				this.setDefaultThresholds();
			}
		} catch (error) {
			console.error('Error loading thresholds:', error);
			this.setDefaultThresholds();
		}
	}

	private setDefaultThresholds(): void {
		this.currentThresholds = {
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 30, max: 70 },
			waterLevelThreshold: { min: 20, max: 90 }
		};
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

		// THAY ĐỔI: Thực thi tuần tự thay vì song song
		// Loại bỏ Promise.all để tránh gửi thông báo trùng lặp
		await this.checkTemperature(sensorData.temperature, traceId);
		await this.checkHumidity(sensorData.humidity, traceId);
		await this.checkSoilMoisture(sensorData.soilMoisture, traceId);
		await this.checkWaterLevel(sensorData.waterLevel, traceId);
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

		if (value < threshold.min) {
			console.log(`[${traceId}] 🚨 [Temperature] BELOW threshold: ${value}°C < ${threshold.min}°C`);
			await notificationService.triggerAlert({
				type: 'temperature',
				level: value < threshold.min - 5 ? 'critical' : 'high',
				message: `Temperature too low: ${value}°C (minimum: ${threshold.min}°C)`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending temperature alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendTemperatureAlert(value, threshold, this.emailRecipients);
			}
		} else if (value > threshold.max) {
			console.log(`[${traceId}] 🚨 [Temperature] ABOVE threshold: ${value}°C > ${threshold.max}°C`);
			await notificationService.triggerAlert({
				type: 'temperature',
				level: value > threshold.max + 5 ? 'critical' : 'high',
				message: `Temperature too high: ${value}°C (maximum: ${threshold.max}°C)`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending temperature alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendTemperatureAlert(value, threshold, this.emailRecipients);
			}
		} else {
			console.log(`✅ Temperature within range: ${value}°C`);
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

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending humidity alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendHumidityAlert(value, threshold, this.emailRecipients);
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

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending humidity alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendHumidityAlert(value, threshold, this.emailRecipients);
			}
		} else {
			console.log(`✅ Humidity within range: ${value}%`);
		}

		this.lastCheckedValues.set('humidity', value);
	}

	private async checkSoilMoisture(value: number, traceId: string): Promise<void> {
		if (!this.currentThresholds) return;

		const threshold = this.currentThresholds.soilMoistureThreshold;
		const lastValue = this.lastCheckedValues.get('soilMoisture');

		console.log(`[${traceId}] 🌱 Checking soil moisture: ${value}% (min: ${threshold.min}, max: ${threshold.max})`);
		
		if (lastValue !== undefined && Math.abs(value - lastValue) < 2) {
			console.log(`[${traceId}] 🌱 Soil moisture change too small: ${value}% vs last ${lastValue}%`);
			return;
		}

		if (value < threshold.min) {
			console.log(`[${traceId}] 🚨 [Soil Moisture] BELOW threshold: ${value}% < ${threshold.min}%`);
			await notificationService.triggerAlert({
				type: 'soilMoisture',
				level: value < threshold.min - 10 ? 'critical' : 'high',
				message: `Soil moisture too low: ${value}% (minimum: ${threshold.min}%) - Plants need watering`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending soil moisture alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendSoilMoistureAlert(value, threshold, this.emailRecipients);
			}
		} else if (value > threshold.max) {
			console.log(`[${traceId}] 🚨 [Soil Moisture] ABOVE threshold: ${value}% > ${threshold.max}%`);
			await notificationService.triggerAlert({
				type: 'soilMoisture',
				level: 'medium',
				message: `Soil moisture too high: ${value}% (maximum: ${threshold.max}%) - Risk of root rot`,
				currentValue: value,
				threshold: threshold
			});

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending soil moisture alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendSoilMoistureAlert(value, threshold, this.emailRecipients);
			}
		} else {
			console.log(`✅ Soil moisture within range: ${value}%`);
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

			// Send email alert
			if (this.emailRecipients.length > 0) {
				console.log(`📧 Sending water level alert email to ${this.emailRecipients.length} recipients`);
				await emailService.sendWaterLevelAlert(value, threshold, this.emailRecipients);
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
				await emailService.sendMotionDetectedAlert(this.emailRecipients);
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
				await emailService.sendSystemErrorAlert(error, component, this.emailRecipients);
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

		return await emailService.sendTestEmail(this.emailRecipients);
	}

	// Get email service status
	getEmailStatus(): { enabled: boolean; configured: boolean; recipients: number } {
		const status = emailService.getStatus();
		return {
			...status,
			recipients: this.emailRecipients.length
		};
	}
}

export const alertService = new AlertService();
export { AlertService };
