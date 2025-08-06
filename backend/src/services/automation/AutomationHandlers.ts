import { AutomationConfig } from './AutomationConfig';
import { DeviceController } from './DeviceController';
import { AppConstants } from '../../config/AppConfig';
export class AutomationHandlers {
	private deviceController: DeviceController;
	private config: AutomationConfig;
	private lastLightAutomation = 0;
	private lastPumpAutomation = 0;
	private lastDoorAutomation = 0;
	private lastWindowAutomation = 0;
	private readonly AUTOMATION_COOLDOWN = AppConstants.ALERT_DEBOUNCE_TIME / 8; // 15 seconds

	constructor(config: AutomationConfig, deviceController: DeviceController) {
		this.config = config;
		this.deviceController = deviceController;
	}

	async handleLightAutomation(lightLevel: number, now: number): Promise<void> {
		const configData = this.config.getConfig();
		if (!configData?.lightControlEnabled) {
			return;
		}

		if (now - this.lastLightAutomation < this.AUTOMATION_COOLDOWN) {
			return;
		}

		try {
			if (lightLevel <= configData.lightThresholds.turnOnWhenDark) {
				await this.deviceController.controlDevice('light', 'on', `Light level too low: ${lightLevel} <= ${configData.lightThresholds.turnOnWhenDark}`, lightLevel);
				this.lastLightAutomation = now;
			} else if (lightLevel >= configData.lightThresholds.turnOffWhenBright) {
				await this.deviceController.controlDevice('light', 'off', `Light level too high: ${lightLevel} >= ${configData.lightThresholds.turnOffWhenBright}`, lightLevel);
				this.lastLightAutomation = now;
			}
		} catch (error) {
			console.error('❌ Light automation failed:', error);
		}
	}

	async handlePumpAutomation(soilMoisture: number, now: number): Promise<void> {
		const configData = this.config.getConfig();
		if (!configData?.pumpControlEnabled) {
			return;
		}

		if (now - this.lastPumpAutomation < this.AUTOMATION_COOLDOWN) {
			return;
		}

		try {
			if (soilMoisture <= configData.pumpThresholds.turnOnWhenDry) {
				await this.deviceController.controlDevice('pump', 'on', `Soil moisture too low: ${soilMoisture} <= ${configData.pumpThresholds.turnOnWhenDry}`, soilMoisture);
				this.lastPumpAutomation = now;
			} else if (soilMoisture >= configData.pumpThresholds.turnOffWhenWet) {
				await this.deviceController.controlDevice('pump', 'off', `Soil moisture too high: ${soilMoisture} >= ${configData.pumpThresholds.turnOffWhenWet}`, soilMoisture);
				this.lastPumpAutomation = now;
			}
		} catch (error) {
			console.error('❌ Pump automation failed:', error);
		}
	}

	async handleTemperatureAutomation(temperature: number, now: number): Promise<void> {
		const configData = this.config.getConfig();
		if (!configData?.doorControlEnabled && !configData?.windowControlEnabled) {
			return;
		}

		try {
			if (temperature >= configData.temperatureThresholds.windowOpenTemp) {
				if (configData.doorControlEnabled && temperature >= configData.temperatureThresholds.doorOpenTemp && (now - this.lastDoorAutomation >= this.AUTOMATION_COOLDOWN)) {
					await this.deviceController.controlDevice('door', 'open', `Temperature too high: ${temperature} >= ${configData.temperatureThresholds.doorOpenTemp}`, temperature);
					this.lastDoorAutomation = now;
				}

				if (configData.windowControlEnabled && (now - this.lastWindowAutomation >= this.AUTOMATION_COOLDOWN)) {
					await this.deviceController.controlDevice('window', 'open', `Temperature too high: ${temperature} >= ${configData.temperatureThresholds.windowOpenTemp}`, temperature);
					this.lastWindowAutomation = now;
				}
			} else if (temperature <= configData.temperatureThresholds.windowCloseTemp) {
				if (configData.doorControlEnabled && temperature <= configData.temperatureThresholds.doorCloseTemp && (now - this.lastDoorAutomation >= this.AUTOMATION_COOLDOWN)) {
					await this.deviceController.controlDevice('door', 'close', `Temperature too low: ${temperature} <= ${configData.temperatureThresholds.doorCloseTemp}`, temperature);
					this.lastDoorAutomation = now;
				}

				if (configData.windowControlEnabled && (now - this.lastWindowAutomation >= this.AUTOMATION_COOLDOWN)) {
					await this.deviceController.controlDevice('window', 'close', `Temperature too low: ${temperature} <= ${configData.temperatureThresholds.windowCloseTemp}`, temperature);
					this.lastWindowAutomation = now;
				}
			}
		} catch (error) {
			console.error('❌ Temperature automation failed:', error);
		}
	}

	async handleRainAutomation(rainStatus: number, now: number): Promise<void> {
		const configData = this.config.getConfig();
		if (!configData?.windowControlEnabled || !configData?.rainSettings.autoCloseWindowOnRain) {
			return;
		}

		if (now - this.lastWindowAutomation < this.AUTOMATION_COOLDOWN) {
			return;
		}

		try {
			if (rainStatus === 1) {
				await this.deviceController.controlDevice('window', 'close', 'Rain detected - closing window for protection', rainStatus);
				this.lastWindowAutomation = now;
			}
		} catch (error) {
			console.error('❌ Rain automation failed:', error);
		}
	}

	async handleWaterLevelAutomation(waterLevel: number, now: number): Promise<void> {
		const configData = this.config.getConfig();
		if (!configData?.pumpControlEnabled || !configData?.waterLevelSettings.autoTurnOffPumpOnFlood) {
			return;
		}

		if (now - this.lastPumpAutomation < this.AUTOMATION_COOLDOWN) {
			return;
		}

		try {
			if (waterLevel === 1) { // 1 = flooded
				await this.deviceController.controlDevice('pump', 'off', `Water level flooded: ${waterLevel} - emergency pump shutdown`, waterLevel);
				this.lastPumpAutomation = now;
			}
		} catch (error) {
			console.error('❌ Water level automation failed:', error);
		}
	}
}
