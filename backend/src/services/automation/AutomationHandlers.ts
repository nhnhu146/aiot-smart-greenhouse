import { AutomationConfig } from './AutomationConfig';
import { DeviceController } from './DeviceController';
import { DeviceStatus } from '../../models';

interface DeviceStateCache {
	status: boolean;
	lastTriggeredAt: number;
	lastSensorValue?: number;
	lastTriggerReason?: string;
}

export class AutomationHandlers {
	private deviceController: DeviceController;
	private config: AutomationConfig;

	// Remove time-based cooldowns, replace with state-based tracking
	private deviceStateCache = new Map<string, DeviceStateCache>();

	// Minimum time between checking same condition (anti-spam)
	private readonly MIN_RECHECK_INTERVAL = 1000; // 1 second

	constructor(config: AutomationConfig, deviceController: DeviceController) {
		this.config = config;
		this.deviceController = deviceController;
		// Initialize device state cache
		this.initializeDeviceStateCache();
	}

	/**
	 * Initialize device state cache from database
	 */
	private async initializeDeviceStateCache(): Promise<void> {
		try {
			const deviceStatuses = await DeviceStatus.find({}).lean();

			for (const device of deviceStatuses) {
				this.deviceStateCache.set(device.deviceType, {
					status: device.status,
					lastTriggeredAt: Date.now(),
					lastSensorValue: undefined,
					lastTriggerReason: undefined
				});
			}

			console.log('🎯 Device state cache initialized for', deviceStatuses.length, 'devices');
		} catch (error) {
			console.error('❌ Failed to initialize device state cache:', error);
		}
	}

	/**
	 * Check if automation should be triggered based on device state and conditions
	 */
	private shouldTriggerAutomation(
		deviceType: string,
		targetStatus: boolean,
		sensorValue: number,
		reason: string,
		now: number
	): boolean {
		const currentState = this.deviceStateCache.get(deviceType);

		// If no cached state, allow trigger (first time)
		if (!currentState) {
			return true;
		}

		// Anti-spam: Don't check same condition too frequently
		if (now - currentState.lastTriggeredAt < this.MIN_RECHECK_INTERVAL) {
			console.log(`⏳ [${deviceType}] Anti-spam: Last check ${now - currentState.lastTriggeredAt}ms ago, skipping`);
			return false;
		}

		// If device is already in target state, don't trigger unless sensor value changed significantly
		if (currentState.status === targetStatus) {
			const sensorValueChanged = currentState.lastSensorValue !== undefined &&
				Math.abs(sensorValue - currentState.lastSensorValue) > 0.1; // Allow small variations

			if (!sensorValueChanged) {
				console.log(`🔄 [${deviceType}] Device already in target state (${targetStatus ? 'ON' : 'OFF'}), sensor unchanged, skipping`);
				return false;
			}

			console.log(`🔄 [${deviceType}] Device in target state but sensor value changed: ${currentState.lastSensorValue} → ${sensorValue}`);
		}

		return true;
	}

	/**
	 * Update device state cache after triggering automation
	 */
	private updateDeviceStateCache(deviceType: string, status: boolean, sensorValue: number, reason: string, now: number): void {
		this.deviceStateCache.set(deviceType, {
			status,
			lastTriggeredAt: now,
			lastSensorValue: sensorValue,
			lastTriggerReason: reason
		});

		console.log(`🎯 Updated cache for ${deviceType}: ${status ? 'ON' : 'OFF'}, value: ${sensorValue}`);
	}

	async handleLightAutomation(lightLevel: number, now: number): Promise<void> {
		const configData = this.config.getConfig();
		if (!configData?.lightControlEnabled) {
			return;
		}

		try {
			if (lightLevel <= configData.lightThresholds.turnOnWhenDark) {
				const reason = `Light level too low: ${lightLevel} <= ${configData.lightThresholds.turnOnWhenDark}`;

				if (this.shouldTriggerAutomation('light', true, lightLevel, reason, now)) {
					await this.deviceController.controlDevice('light', 'on', reason, lightLevel);
					this.updateDeviceStateCache('light', true, lightLevel, reason, now);
					console.log(`💡 Light turned ON: ${reason}`);
				}
			} else if (lightLevel >= configData.lightThresholds.turnOffWhenBright) {
				const reason = `Light level too high: ${lightLevel} >= ${configData.lightThresholds.turnOffWhenBright}`;

				if (this.shouldTriggerAutomation('light', false, lightLevel, reason, now)) {
					await this.deviceController.controlDevice('light', 'off', reason, lightLevel);
					this.updateDeviceStateCache('light', false, lightLevel, reason, now);
					console.log(`💡 Light turned OFF: ${reason}`);
				}
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

		try {
			if (soilMoisture <= configData.pumpThresholds.turnOnWhenDry) {
				const reason = `Soil moisture too low: ${soilMoisture} <= ${configData.pumpThresholds.turnOnWhenDry}`;

				if (this.shouldTriggerAutomation('pump', true, soilMoisture, reason, now)) {
					await this.deviceController.controlDevice('pump', 'on', reason, soilMoisture);
					this.updateDeviceStateCache('pump', true, soilMoisture, reason, now);
					console.log(`💧 Pump turned ON: ${reason}`);
				}
			} else if (soilMoisture >= configData.pumpThresholds.turnOffWhenWet) {
				const reason = `Soil moisture too high: ${soilMoisture} >= ${configData.pumpThresholds.turnOffWhenWet}`;

				if (this.shouldTriggerAutomation('pump', false, soilMoisture, reason, now)) {
					await this.deviceController.controlDevice('pump', 'off', reason, soilMoisture);
					this.updateDeviceStateCache('pump', false, soilMoisture, reason, now);
					console.log(`💧 Pump turned OFF: ${reason}`);
				}
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
				// Door automation
				if (configData.doorControlEnabled && temperature >= configData.temperatureThresholds.doorOpenTemp) {
					const reason = `Temperature too high: ${temperature} >= ${configData.temperatureThresholds.doorOpenTemp}`;

					if (this.shouldTriggerAutomation('door', true, temperature, reason, now)) {
						await this.deviceController.controlDevice('door', 'open', reason, temperature);
						this.updateDeviceStateCache('door', true, temperature, reason, now);
						console.log(`🚪 Door opened: ${reason}`);
					}
				}

				// Window automation
				if (configData.windowControlEnabled) {
					const reason = `Temperature too high: ${temperature} >= ${configData.temperatureThresholds.windowOpenTemp}`;

					if (this.shouldTriggerAutomation('window', true, temperature, reason, now)) {
						await this.deviceController.controlDevice('window', 'open', reason, temperature);
						this.updateDeviceStateCache('window', true, temperature, reason, now);
						console.log(`🪟 Window opened: ${reason}`);
					}
				}
			} else if (temperature <= configData.temperatureThresholds.windowCloseTemp) {
				// Door automation
				if (configData.doorControlEnabled && temperature <= configData.temperatureThresholds.doorCloseTemp) {
					const reason = `Temperature too low: ${temperature} <= ${configData.temperatureThresholds.doorCloseTemp}`;

					if (this.shouldTriggerAutomation('door', false, temperature, reason, now)) {
						await this.deviceController.controlDevice('door', 'close', reason, temperature);
						this.updateDeviceStateCache('door', false, temperature, reason, now);
						console.log(`🚪 Door closed: ${reason}`);
					}
				}

				// Window automation
				if (configData.windowControlEnabled) {
					const reason = `Temperature too low: ${temperature} <= ${configData.temperatureThresholds.windowCloseTemp}`;

					if (this.shouldTriggerAutomation('window', false, temperature, reason, now)) {
						await this.deviceController.controlDevice('window', 'close', reason, temperature);
						this.updateDeviceStateCache('window', false, temperature, reason, now);
						console.log(`🪟 Window closed: ${reason}`);
					}
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

		try {
			if (rainStatus === 1) {
				const reason = 'Rain detected - closing window for protection';

				if (this.shouldTriggerAutomation('window', false, rainStatus, reason, now)) {
					await this.deviceController.controlDevice('window', 'close', reason, rainStatus);
					this.updateDeviceStateCache('window', false, rainStatus, reason, now);
					console.log('🌧️ Window closed due to rain');
				}
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

		try {
			if (waterLevel === 1) { // 1 = flooded
				const reason = `Water level flooded: ${waterLevel} - emergency pump shutdown`;

				// Emergency condition: always check, but still prevent spam
				const currentState = this.deviceStateCache.get('pump');
				if (!currentState || currentState.status !== false || (now - currentState.lastTriggeredAt) > this.MIN_RECHECK_INTERVAL) {
					await this.deviceController.controlDevice('pump', 'off', reason, waterLevel);
					this.updateDeviceStateCache('pump', false, waterLevel, reason, now);
					console.log('🚨 Emergency pump shutdown due to flood');
				}
			}
		} catch (error) {
			console.error('❌ Water level automation failed:', error);
		}
	}

	/**
	 * Get current device state cache for monitoring/debugging
	 */
	getDeviceStateCache(): Map<string, DeviceStateCache> {
		return new Map(this.deviceStateCache);
	}

	/**
	 * Force refresh device state cache from database
	 */
	async refreshDeviceStateCache(): Promise<void> {
		await this.initializeDeviceStateCache();
	}
}