import { AutomationSettings } from '../models';
import { IAutomationSettings } from '../models/AutomationSettings';
import { mqttService } from './index';
import { DeviceHistory } from '../models';

class AutomationService {
	private config: IAutomationSettings | null = null;
	private lastLightAutomation = 0;
	private lastPumpAutomation = 0;
	private lastDoorAutomation = 0;
	private lastWindowAutomation = 0;
	private readonly AUTOMATION_COOLDOWN = 30000; // 30 seconds cooldown between automations

	constructor() {
		this.loadConfiguration();
	}

	// Load automation configuration from database
	async loadConfiguration(): Promise<void> {
		try {
			let settings = await AutomationSettings.findOne();

			if (!settings) {
				// Create default settings if none exist
				settings = new AutomationSettings();
				await settings.save();
				console.log('🔧 Created default automation settings');
			}

			this.config = settings;
			console.log('🔧 Automation configuration loaded:', {
				enabled: settings.automationEnabled,
				lightControl: settings.lightControlEnabled,
				pumpControl: settings.pumpControlEnabled,
				doorControl: settings.doorControlEnabled,
				windowControl: settings.windowControlEnabled
			});
		} catch (error) {
			console.error('❌ Failed to load automation configuration:', error);
			this.config = null;
		}
	}

	// Process sensor data for automation
	async processSensorData(sensorType: string, value: number): Promise<void> {
		if (!this.config || !this.config.automationEnabled) {
			return; // Automation is disabled
		}

		const now = Date.now();

		try {
			switch (sensorType) {
				case 'lightLevel':
					await this.handleLightAutomation(value, now);
					break;
				case 'soilMoisture':
					await this.handlePumpAutomation(value, now);
					break;
				case 'temperature':
					await this.handleTemperatureAutomation(value, now);
					break;
				case 'motion':
					await this.handleMotionAutomation(value, now);
					break;
				case 'rainStatus':
					await this.handleRainAutomation(value, now);
					break;
				case 'waterLevel':
					await this.handleWaterLevelAutomation(value, now);
					break;
				default:
					// Sensor type not handled by automation
					break;
			}
		} catch (error) {
			console.error(`❌ Automation error for ${sensorType}:`, error);
		}
	}

	// Handle light automation based on light level sensor
	private async handleLightAutomation(lightLevel: number, now: number): Promise<void> {
		if (!this.config!.lightControlEnabled || (now - this.lastLightAutomation) < this.AUTOMATION_COOLDOWN) {
			return;
		}

		const { turnOnWhenDark, turnOffWhenBright } = this.config!.lightThresholds;

		if (lightLevel === turnOnWhenDark) { // Dark - turn on light
			await this.controlDevice('light', '1', 'Auto: Light level dark');
			this.lastLightAutomation = now;
		} else if (lightLevel === turnOffWhenBright) { // Bright - turn off light
			await this.controlDevice('light', '0', 'Auto: Light level bright');
			this.lastLightAutomation = now;
		}
	}

	// Handle pump automation based on soil moisture sensor
	private async handlePumpAutomation(soilMoisture: number, now: number): Promise<void> {
		if (!this.config!.pumpControlEnabled || (now - this.lastPumpAutomation) < this.AUTOMATION_COOLDOWN) {
			return;
		}

		const { turnOnWhenDry, turnOffWhenWet } = this.config!.pumpThresholds;

		if (soilMoisture === turnOnWhenDry) { // Dry - turn on pump
			await this.controlDevice('pump', '1', 'Auto: Soil moisture dry');
			this.lastPumpAutomation = now;
		} else if (soilMoisture === turnOffWhenWet) { // Wet - turn off pump
			await this.controlDevice('pump', '0', 'Auto: Soil moisture wet');
			this.lastPumpAutomation = now;
		}
	}

	// Handle temperature-based window/door automation
	private async handleTemperatureAutomation(temperature: number, now: number): Promise<void> {
		const { windowOpenTemp, windowCloseTemp, doorOpenTemp, doorCloseTemp } = this.config!.temperatureThresholds;

		// Window control
		if (this.config!.windowControlEnabled && (now - this.lastWindowAutomation) >= this.AUTOMATION_COOLDOWN) {
			if (temperature >= windowOpenTemp) {
				await this.controlDevice('window', '1', `Auto: Temperature high (${temperature}°C)`);
				this.lastWindowAutomation = now;
			} else if (temperature <= windowCloseTemp) {
				await this.controlDevice('window', '0', `Auto: Temperature normal (${temperature}°C)`);
				this.lastWindowAutomation = now;
			}
		}

		// Door control (emergency)
		if (this.config!.doorControlEnabled && (now - this.lastDoorAutomation) >= this.AUTOMATION_COOLDOWN) {
			if (temperature >= doorOpenTemp) {
				await this.controlDevice('door', '1', `Auto: Emergency temperature (${temperature}°C)`);
				this.lastDoorAutomation = now;
			} else if (temperature <= doorCloseTemp) {
				await this.controlDevice('door', '0', `Auto: Temperature normal (${temperature}°C)`);
				this.lastDoorAutomation = now;
			}
		}
	}

	// Handle motion detection automation
	private async handleMotionAutomation(motionDetected: number, now: number): Promise<void> {
		if (!this.config!.doorControlEnabled || !this.config!.motionSettings.autoOpenDoorOnMotion) {
			return;
		}

		if (motionDetected === 1 && (now - this.lastDoorAutomation) >= this.AUTOMATION_COOLDOWN) {
			await this.controlDevice('door', '1', 'Auto: Motion detected');
			this.lastDoorAutomation = now;
		}
	}

	// Handle rain detection automation
	private async handleRainAutomation(rainStatus: number, now: number): Promise<void> {
		if (!this.config!.windowControlEnabled) {
			return;
		}

		if (rainStatus === 1 && this.config!.rainSettings.autoCloseWindowOnRain && (now - this.lastWindowAutomation) >= this.AUTOMATION_COOLDOWN) {
			await this.controlDevice('window', '0', 'Auto: Rain detected');
			this.lastWindowAutomation = now;
		} else if (rainStatus === 0 && this.config!.rainSettings.autoOpenAfterRain && (now - this.lastWindowAutomation) >= this.AUTOMATION_COOLDOWN) {
			await this.controlDevice('window', '1', 'Auto: Rain stopped');
			this.lastWindowAutomation = now;
		}
	}

	// Handle water level automation (emergency)
	private async handleWaterLevelAutomation(waterLevel: number, now: number): Promise<void> {
		if (waterLevel === 1) { // Flooded
			if (this.config!.waterLevelSettings.autoTurnOffPumpOnFlood && this.config!.pumpControlEnabled) {
				await this.controlDevice('pump', '0', 'Auto: Emergency - Flood detected');
			}

			if (this.config!.waterLevelSettings.autoOpenDoorOnFlood && this.config!.doorControlEnabled) {
				await this.controlDevice('door', '1', 'Auto: Emergency - Flood drainage');
			}
		}
	}

	// Control device via MQTT
	private async controlDevice(device: string, action: string, reason: string): Promise<void> {
		try {
			mqttService.publishDeviceControl(device, action);

			// Log automation action
			const deviceHistory = new DeviceHistory({
				deviceType: device as any,
				action: action === '1' ? 'on' : 'off',
				automated: true,
				automationReason: reason,
				triggeredAt: new Date()
			});

			await deviceHistory.save();

			console.log(`🤖 Automation: ${device} ${action === '1' ? 'ON' : 'OFF'} - ${reason}`);
		} catch (error) {
			console.error(`❌ Failed to control ${device}:`, error);
		}
	}

	// Get current automation configuration
	getConfiguration(): IAutomationSettings | null {
		return this.config;
	}

	// Update configuration (called when settings change)
	async updateConfiguration(newConfig: Partial<IAutomationSettings>): Promise<void> {
		try {
			let settings = await AutomationSettings.findOne();

			if (!settings) {
				settings = new AutomationSettings();
			}

			Object.assign(settings, newConfig);
			await settings.save();

			// Reload the complete configuration from database to ensure sync
			await this.loadConfiguration();
			console.log('🔧 Automation configuration updated and reloaded');
		} catch (error) {
			console.error('❌ Failed to update automation configuration:', error);
		}
	}
}

export default new AutomationService();
