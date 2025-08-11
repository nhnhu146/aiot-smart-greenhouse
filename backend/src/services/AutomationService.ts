import { webSocketService } from './index';
import { AutomationConfig } from './automation/AutomationConfig';
import { DeviceController } from './automation/DeviceController';
import { AutomationHandlers } from './automation/AutomationHandlers';
import { IAutomationSettings } from '../models/AutomationSettings';
import { SensorData } from '../models';
class AutomationService {
	private config: AutomationConfig;
	private deviceController: DeviceController;
	private handlers: AutomationHandlers;
	private isDataProcessing = false;

	constructor() {
		this.config = new AutomationConfig();
		this.deviceController = new DeviceController();
		this.handlers = new AutomationHandlers(this.config, this.deviceController);
		this.loadConfiguration();
	}

	async loadConfiguration(): Promise<void> {
		await this.config.loadConfiguration();
		// Refresh device state cache when config loads
		await this.handlers.refreshDeviceStateCache();
		this.broadcastAutomationStatus();
	}

	async reloadConfiguration(): Promise<void> {
		await this.config.reloadConfiguration();
		if (!this.config.isEnabled()) {
			console.log('🛑 Automation has been DISABLED - all automatic control stopped');
		} else {
			console.log('✅ Automation has been ENABLED - automatic control resumed');
			// Refresh device state cache and immediately check automation with latest data when enabled
			await this.handlers.refreshDeviceStateCache();
			await this.processImmediateAutomationCheck();
		}

		this.broadcastAutomationStatus();
	}

	private broadcastAutomationStatus(): void {
		try {
			const automationStatus = this.getAutomationStatus();
			webSocketService.broadcastAutomationStatus(automationStatus);
		} catch (error) {
			console.error('Failed to broadcast automation status:', error);
		}
	}

	setDataProcessing(processing: boolean): void {
		this.isDataProcessing = processing;
		if (processing) {
			console.log('🔄 Data processing started - automation temporarily paused');
		} else {
			console.log('✅ Data processing completed - automation resumed');
		}
	}

	isAutomationReady(): boolean {
		return this.config.isEnabled() && !this.isDataProcessing;
	}

	getAutomationStatus(): any {
		const deviceCache = this.handlers.getDeviceStateCache();
		const deviceStates: any = {};

		// Convert cache to serializable format
		for (const [deviceType, state] of deviceCache.entries()) {
			deviceStates[deviceType] = {
				status: state.status,
				lastTriggeredAt: new Date(state.lastTriggeredAt).toISOString(),
				lastSensorValue: state.lastSensorValue,
				lastTriggerReason: state.lastTriggerReason
			};
		}

		return {
			enabled: this.config.isEnabled(),
			ready: this.isAutomationReady(),
			lastUpdate: new Date().toISOString(),
			activeControls: {
				light: this.config.isLightControlEnabled(),
				pump: this.config.isPumpControlEnabled(),
				door: this.config.isDoorControlEnabled(),
				window: this.config.isWindowControlEnabled()
			},
			dataProcessing: this.isDataProcessing,
			deviceStates: deviceStates, // Add device states to status
			spamPrevention: {
				enabled: true,
				minRecheckInterval: 5000, // 5 seconds
				stateBasedLogic: true
			}
		};
	}

	async processSensorData(sensorType: string, value: number): Promise<void> {
		if (!this.isAutomationReady()) {
			return;
		}

		const now = Date.now();
		try {
			// Process sensor data immediately without delay
			switch (sensorType) {
				case 'lightLevel':
				case 'light': // Handle both formats
					await this.handlers.handleLightAutomation(value, now);
					break;
				case 'soilMoisture':
				case 'soil': // Handle both formats
					await this.handlers.handlePumpAutomation(value, now);
					break;
				case 'temperature':
					await this.handlers.handleTemperatureAutomation(value, now);
					break;
				case 'rainStatus':
				case 'rain': // Handle both formats
					await this.handlers.handleRainAutomation(value, now);
					break;
				// Water level automation removed - no longer needed
				default:
					console.log(`⚠️ Unknown sensor type for automation: ${sensorType}`);
			}
		} catch (error) {
			console.error(`❌ Automation processing failed for ${sensorType}:`, error);
		}
	}

	async processImmediateAutomationCheck(): Promise<void> {
		if (!this.isAutomationReady()) {
			console.log('⏸️ Automation check skipped - automation not ready');
			return;
		}

		try {
			console.log('🔍 Running immediate automation check with state-based spam prevention...');
			const latestSensorData = await SensorData.findOne()
				.sort({ createdAt: -1 })
				.lean();

			if (!latestSensorData) {
				console.log('⚠️ No sensor data found for automation check');
				return;
			}

			const now = Date.now();

			// Process all sensor types in parallel without delay
			const promises = [];

			if (latestSensorData.lightLevel !== null && latestSensorData.lightLevel !== undefined) {
				promises.push(this.handlers.handleLightAutomation(latestSensorData.lightLevel, now));
			}

			if (latestSensorData.soilMoisture !== null && latestSensorData.soilMoisture !== undefined) {
				promises.push(this.handlers.handlePumpAutomation(latestSensorData.soilMoisture, now));
			}

			if (latestSensorData.temperature !== null && latestSensorData.temperature !== undefined) {
				promises.push(this.handlers.handleTemperatureAutomation(latestSensorData.temperature, now));
			}

			if (latestSensorData.rainStatus !== null && latestSensorData.rainStatus !== undefined) {
				promises.push(this.handlers.handleRainAutomation(latestSensorData.rainStatus, now));
			}

			// Water level automation removed - no longer processes water level data

			await Promise.all(promises);
			console.log('✅ Immediate automation check completed with spam prevention');
		} catch (error) {
			console.error('❌ Immediate automation check failed:', error);
		}
	}

	async updateConfiguration(newConfig: Partial<IAutomationSettings>): Promise<void> {
		await this.config.updateConfiguration(newConfig);
		this.broadcastAutomationStatus();
	}

	async enableAutomation(): Promise<boolean> {
		try {
			await this.updateConfiguration({ automationEnabled: true });
			await this.handlers.refreshDeviceStateCache();
			console.log('✅ Automation enabled successfully with state-based spam prevention');
			return true;
		} catch (error) {
			console.error('❌ Failed to enable automation:', error);
			return false;
		}
	}

	async disableAutomation(): Promise<boolean> {
		try {
			await this.updateConfiguration({ automationEnabled: false });
			console.log('🛑 Automation disabled successfully');
			return true;
		} catch (error) {
			console.error('❌ Failed to disable automation:', error);
			return false;
		}
	}

	async toggleAutomation(): Promise<boolean> {
		try {
			const currentState = this.config.isEnabled();
			const newState = !currentState;
			await this.updateConfiguration({ automationEnabled: newState });

			if (newState) {
				await this.handlers.refreshDeviceStateCache();
			}

			console.log(`🔄 Automation toggled: ${currentState} -> ${newState} (spam prevention: ${newState ? 'ON' : 'OFF'})`);
			return newState;
		} catch (error) {
			console.error('❌ Failed to toggle automation:', error);
			return false;
		}
	}

	async runAutomationCheck(): Promise<{ success: boolean; message: string; automationSettings?: any }> {
		try {
			await this.processImmediateAutomationCheck();
			return {
				success: true,
				message: 'Automation check completed successfully with state-based spam prevention',
				automationSettings: this.getAutomationStatus()
			};
		} catch (error) {
			console.error('❌ Manual automation check failed:', error);
			return {
				success: false,
				message: `Automation check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}

	/**
	 * Force refresh device state cache (useful for debugging or manual sync)
	 */
	async refreshDeviceStateCache(): Promise<void> {
		await this.handlers.refreshDeviceStateCache();
		console.log('🎯 Device state cache refreshed manually');
	}

	/**
	 * Get current device state cache for monitoring
	 */
	getDeviceStateCache(): Map<string, any> {
		return this.handlers.getDeviceStateCache();
	}
}

const automationService = new AutomationService();
export default automationService;