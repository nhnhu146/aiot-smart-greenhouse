import { AutomationSettings, SensorData } from '../models';
import { IAutomationSettings } from '../models/AutomationSettings';
import { mqttService } from './index';
import { DeviceHistory } from '../models';
import logger from '../utils/logger';

class AutomationService {
	private config: IAutomationSettings | null = null;
	private lastLightAutomation = 0;
	private lastPumpAutomation = 0;
	private lastDoorAutomation = 0;
	private lastWindowAutomation = 0;
	private readonly AUTOMATION_COOLDOWN = 15000; // 15 seconds cooldown between automations (reduced from 30s)
	private isDataProcessing = false; // Flag to prevent automation during data merge

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

	// Reload configuration from database (called when settings are updated)
	async reloadConfiguration(): Promise<void> {
		console.log('🔄 Reloading automation configuration...');
		await this.loadConfiguration();

		// If automation is now disabled, log it
		if (this.config && !this.config.automationEnabled) {
			console.log('🛑 Automation has been DISABLED - all automatic control stopped');
		} else if (this.config && this.config.automationEnabled) {
			console.log('✅ Automation has been ENABLED - automatic control resumed');
		}
	}

	// Set data processing flag to prevent automation during data merge
	setDataProcessing(processing: boolean): void {
		this.isDataProcessing = processing;
		if (processing) {
			console.log('🔄 Data processing started - automation temporarily paused');
		} else {
			console.log('✅ Data processing completed - automation resumed');
		}
	}

	// Check if automation is enabled and ready
	isAutomationReady(): boolean {
		return this.config !== null &&
			this.config.automationEnabled &&
			!this.isDataProcessing;
	}

	// Get current automation status for API
	getAutomationStatus(): any {
		return {
			enabled: this.config?.automationEnabled ?? false,
			ready: this.isAutomationReady(),
			lastUpdate: new Date().toISOString(),
			activeControls: {
				light: this.config?.lightControlEnabled ?? false,
				pump: this.config?.pumpControlEnabled ?? false,
				door: this.config?.doorControlEnabled ?? false,
				window: this.config?.windowControlEnabled ?? false
			},
			config: this.config
		};
	}

	// Process sensor data for automation - only after data merge
	async processSensorData(sensorType: string, value: number): Promise<void> {
		// Ensure automation is enabled and not during data processing
		if (!this.isAutomationReady()) {
			console.log(`🛑 Automation skipped for ${sensorType}: automation not ready (enabled: ${this.config?.automationEnabled}, processing: ${this.isDataProcessing})`);
			return;
		}

		const now = Date.now();

		try {
			console.log(`🔧 Processing automation for ${sensorType}: ${value}`);

			switch (sensorType) {
				case 'lightLevel':
				case 'light':
					await this.handleLightAutomation(value, now);
					break;
				case 'soilMoisture':
				case 'soil':
					await this.handlePumpAutomation(value, now);
					break;
				case 'temperature':
					await this.handleTemperatureAutomation(value, now);
					break;
				case 'motion':
				case 'motionDetected':
					await this.handleMotionAutomation(value, now);
					break;
				case 'rainStatus':
				case 'rain':
					await this.handleRainAutomation(value, now);
					break;
				case 'waterLevel':
				case 'water':
					await this.handleWaterLevelAutomation(value, now);
					break;
				default:
					console.log(`ℹ️ Sensor type '${sensorType}' not handled by automation`);
					break;
			}
		} catch (error) {
			console.error(`❌ Automation error for ${sensorType}:`, error);
		}
	}

	// Handle light automation based on light level sensor
	private async handleLightAutomation(lightLevel: number, now: number): Promise<void> {
		const timeSinceLastAutomation = now - this.lastLightAutomation;

		console.log(`🔧 Light automation check: level=${lightLevel}, enabled=${this.config!.lightControlEnabled}, timeSince=${timeSinceLastAutomation}ms, cooldown=${this.AUTOMATION_COOLDOWN}ms`);

		if (!this.config!.lightControlEnabled) {
			console.log(`🛑 Light automation skipped: light control disabled`);
			return;
		}

		if (timeSinceLastAutomation < this.AUTOMATION_COOLDOWN) {
			console.log(`🛑 Light automation skipped: cooldown active (${timeSinceLastAutomation}ms < ${this.AUTOMATION_COOLDOWN}ms)`);
			return;
		}

		const { turnOnWhenDark, turnOffWhenBright } = this.config!.lightThresholds;
		console.log(`🔧 Light thresholds: turnOnWhenDark=${turnOnWhenDark}, turnOffWhenBright=${turnOffWhenBright}`);

		if (lightLevel === turnOnWhenDark) { // Dark - turn on light
			console.log(`💡 Light automation trigger: TURN ON (level=${lightLevel} === turnOnWhenDark=${turnOnWhenDark})`);
			await this.controlDevice('light', '1', 'Auto: Light level dark');
			this.lastLightAutomation = now;
		} else if (lightLevel === turnOffWhenBright) { // Bright - turn off light
			console.log(`💡 Light automation trigger: TURN OFF (level=${lightLevel} === turnOffWhenBright=${turnOffWhenBright})`);
			await this.controlDevice('light', '0', 'Auto: Light level bright');
			this.lastLightAutomation = now;
		} else {
			console.log(`ℹ️ Light automation: no action needed (level=${lightLevel}, thresholds: dark=${turnOnWhenDark}, bright=${turnOffWhenBright})`);
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

			// Convert action to status and determine action name
			const status = action === '1';
			const actionName = ['light', 'pump'].includes(device)
				? (action === '1' ? 'on' : 'off')
				: (action === '1' ? 'open' : 'close');

			// Save device action to history with proper validation
			try {
				const deviceHistoryData = {
					deviceId: `greenhouse_${device}`,
					deviceType: device as 'light' | 'pump' | 'door' | 'window',
					action: actionName as 'on' | 'off' | 'open' | 'close',
					status: status,
					controlType: 'auto' as const,
					triggeredBy: reason,
					timestamp: new Date(),
					success: true
				};

				const deviceHistory = new DeviceHistory(deviceHistoryData);
				await deviceHistory.save();

				logger.info(`Device history saved: ${device} ${actionName}`);
			} catch (historyError) {
				logger.error(`Failed to save device history for ${device}:`, historyError);
				// Don't fail the automation if history save fails
			}

			logger.info(`Automation: ${device} ${action === '1' ? 'ON' : 'OFF'} - ${reason}`);
		} catch (error) {
			logger.error(`Failed to control ${device}:`, error);
		}
	}

	// Get current automation configuration
	getConfiguration(): IAutomationSettings | null {
		return this.config;
	}

	// Process immediate automation check after config changes
	// This checks all current sensor values against new thresholds
	async processImmediateAutomationCheck(): Promise<void> {
		if (!this.isAutomationReady()) {
			console.log('🛑 Immediate automation check skipped - automation not ready');
			return;
		}

		console.log('⚡ Processing immediate automation check after config change...');

		try {
			// Get latest sensor data from database
			const latestSensorData = await SensorData.findOne().sort({ createdAt: -1 });

			if (!latestSensorData) {
				console.log('ℹ️ No sensor data available for immediate automation check');
				return;
			}

			// Check all sensor types with current values against new thresholds
			const sensorChecks = [
				{ type: 'lightLevel', value: latestSensorData.lightLevel },
				{ type: 'soilMoisture', value: latestSensorData.soilMoisture },
				{ type: 'temperature', value: latestSensorData.temperature },
				{ type: 'rainStatus', value: latestSensorData.rainStatus },
				{ type: 'waterLevel', value: latestSensorData.waterLevel },
				{ type: 'motion', value: latestSensorData.motionDetected }
			];

			// Process each sensor that has data
			for (const sensor of sensorChecks) {
				if (sensor.value !== null && sensor.value !== undefined) {
					console.log(`⚡ Immediate check: ${sensor.type} = ${sensor.value}`);

					// Temporarily reset cooldowns for immediate response
					const originalCooldowns = {
						light: this.lastLightAutomation,
						pump: this.lastPumpAutomation,
						door: this.lastDoorAutomation,
						window: this.lastWindowAutomation
					};

					// Reset cooldowns to allow immediate action
					this.lastLightAutomation = 0;
					this.lastPumpAutomation = 0;
					this.lastDoorAutomation = 0;
					this.lastWindowAutomation = 0;

					// Process automation for this sensor
					await this.processSensorData(sensor.type, sensor.value);

					// Restore cooldowns only for devices that didn't take action
					const now = Date.now();
					if (this.lastLightAutomation === 0) this.lastLightAutomation = originalCooldowns.light;
					if (this.lastPumpAutomation === 0) this.lastPumpAutomation = originalCooldowns.pump;
					if (this.lastDoorAutomation === 0) this.lastDoorAutomation = originalCooldowns.door;
					if (this.lastWindowAutomation === 0) this.lastWindowAutomation = originalCooldowns.window;
				}
			}

			console.log('✅ Immediate automation check completed');

		} catch (error) {
			console.error('❌ Error during immediate automation check:', error);
		}
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

	// Enable automation (called from API)
	async enableAutomation(): Promise<boolean> {
		try {
			await this.updateConfiguration({ automationEnabled: true });
			console.log('✅ Automation ENABLED via API');
			return true;
		} catch (error) {
			console.error('❌ Failed to enable automation:', error);
			return false;
		}
	}

	// Disable automation (called from API)
	async disableAutomation(): Promise<boolean> {
		try {
			await this.updateConfiguration({ automationEnabled: false });

			// Clear all cooldowns to stop any pending automation
			this.lastLightAutomation = 0;
			this.lastPumpAutomation = 0;
			this.lastDoorAutomation = 0;
			this.lastWindowAutomation = 0;

			console.log('🛑 Automation DISABLED via API - all automation stopped');
			return true;
		} catch (error) {
			console.error('❌ Failed to disable automation:', error);
			return false;
		}
	}

	// Toggle automation state
	async toggleAutomation(): Promise<boolean> {
		if (!this.config) {
			await this.loadConfiguration();
		}

		const newState = !this.config?.automationEnabled;

		if (newState) {
			return await this.enableAutomation();
		} else {
			return await this.disableAutomation();
		}
	}
}

export default new AutomationService();
