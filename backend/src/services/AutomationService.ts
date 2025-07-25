import { Settings } from '../models';
import { mqttService } from './index';
import { DeviceHistory } from '../models';

interface AutomationConfig {
	enabled: boolean;
	lightControl: boolean;
	pumpControl: boolean;
	doorControl: boolean;
	windowControl: boolean;
}

class AutomationService {
	private config: AutomationConfig | null = null;
	private lastLightAutomation = 0;
	private lastPumpAutomation = 0;
	private lastDoorAutomation = 0;
	private lastWindowAutomation = 0;

	constructor() {
		this.loadConfiguration();
	}

	// Load automation configuration from database
	async loadConfiguration(): Promise<void> {
		try {
			const settings = await Settings.findOne().lean();
			this.config = {
				enabled: settings?.automation?.enabled ?? true,
				lightControl: settings?.automation?.lightControl ?? true,
				pumpControl: settings?.automation?.pumpControl ?? true,
				doorControl: settings?.automation?.doorControl ?? false,
				windowControl: settings?.automation?.windowControl ?? false
			};
			console.log('⚙️ Automation configuration loaded:', this.config);
		} catch (error) {
			console.error('❌ Error loading automation config:', error);
			// Use default config if database fails
			this.config = {
				enabled: true,
				lightControl: true,
				pumpControl: true,
				doorControl: false,
				windowControl: false
			};
		}
	}

	// Process sensor data for automation triggers
	async processSensorData(sensorType: string, value: number): Promise<void> {
		if (!this.config || !this.config.enabled) {
			return;
		}

		const currentTime = Date.now();

		switch (sensorType) {
			case 'light':
				if (this.config.lightControl) {
					await this.handleLightAutomation(value, currentTime);
				}
				break;
			case 'soil':
				if (this.config.pumpControl) {
					await this.handlePumpAutomation(value, currentTime);
				}
				break;
			case 'temperature':
				// Can be extended for fan/window control based on temperature
				break;
			case 'motion':
				if (this.config.doorControl && value === 1) {
					await this.handleDoorAutomation(value, currentTime);
				}
				break;
		}
	}

	// Handle light automation based on light sensor
	private async handleLightAutomation(lightValue: number, currentTime: number): Promise<void> {
		const shouldTurnOn = lightValue === 0; // Binary: 0 = dark, turn on light

		// Avoid duplicate actions within 60 seconds
		if (currentTime - this.lastLightAutomation < 60000) {
			return;
		}

		try {
			// Send MQTT command (ESP32 expects 1/0)
			const mqttCommand = shouldTurnOn ? '1' : '0';
			await mqttService.publishDeviceControl('light', mqttCommand);

			// Record automation history
			await this.recordAutomationHistory(
				'light',
				shouldTurnOn ? 'on' : 'off',
				`Light sensor: ${lightValue === 0 ? 'dark' : 'bright'}`
			);

			console.log(`💡 Automation: Light turned ${shouldTurnOn ? 'ON' : 'OFF'} (sensor: ${lightValue})`);
			this.lastLightAutomation = currentTime;
		} catch (error) {
			console.error('❌ Error in light automation:', error);
		}
	}

	// Handle pump automation based on soil moisture
	private async handlePumpAutomation(soilValue: number, currentTime: number): Promise<void> {
		const shouldTurnOn = soilValue === 0; // Binary: 0 = dry, turn on pump

		// Avoid duplicate actions within 60 seconds
		if (currentTime - this.lastPumpAutomation < 60000) {
			return;
		}

		try {
			// Send MQTT command (ESP32 expects 1/0)
			const mqttCommand = shouldTurnOn ? '1' : '0';
			await mqttService.publishDeviceControl('pump', mqttCommand);

			// Record automation history
			await this.recordAutomationHistory(
				'pump',
				shouldTurnOn ? 'on' : 'off',
				`Soil moisture: ${soilValue === 0 ? 'dry' : 'wet'}`
			);

			console.log(`💧 Automation: Pump turned ${shouldTurnOn ? 'ON' : 'OFF'} (soil: ${soilValue})`);
			this.lastPumpAutomation = currentTime;
		} catch (error) {
			console.error('❌ Error in pump automation:', error);
		}
	}

	// Handle door automation based on motion detection
	private async handleDoorAutomation(motionValue: number, currentTime: number): Promise<void> {
		if (motionValue !== 1) return; // Only open door on motion detected

		// Avoid duplicate actions within 5 minutes
		if (currentTime - this.lastDoorAutomation < 300000) {
			return;
		}

		try {
			// Send MQTT command to open door (ESP32 expects 1/0)
			await mqttService.publishDeviceControl('door', '1');

			// Record automation history
			await this.recordAutomationHistory(
				'door',
				'open',
				'Motion detected'
			);

			console.log(`🚪 Automation: Door opened due to motion detection`);
			this.lastDoorAutomation = currentTime;
		} catch (error) {
			console.error('❌ Error in door automation:', error);
		}
	}

	// Record automation history
	private async recordAutomationHistory(deviceType: string, action: string, reason: string): Promise<void> {
		try {
			await DeviceHistory.create({
				deviceId: `greenhouse_${deviceType}`,
				deviceType: deviceType,
				action: action,
				status: 'success',
				controlType: 'auto',
				triggeredBy: reason,
				userId: null, // No user for automation
				timestamp: new Date(),
				success: true
			});
			console.log(`📊 Recorded automation history: ${deviceType} ${action} (${reason})`);
		} catch (error) {
			console.error(`❌ Failed to record automation history:`, error);
		}
	}

	// Update automation configuration
	async updateConfiguration(newConfig: Partial<AutomationConfig>): Promise<void> {
		try {
			this.config = { ...this.config, ...newConfig } as AutomationConfig;
			console.log('⚙️ Automation configuration updated in memory:', this.config);
		} catch (error) {
			console.error('❌ Error updating automation config:', error);
		}
	}

	// Get current configuration
	getConfiguration(): AutomationConfig | null {
		return this.config;
	}

	// Force reload configuration from database
	async reloadConfiguration(): Promise<void> {
		await this.loadConfiguration();
	}
}

export default new AutomationService();
