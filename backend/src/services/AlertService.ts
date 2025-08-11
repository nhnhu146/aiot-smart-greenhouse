import { AlertConfig, ThresholdConfig } from './alert/AlertConfig';
import { AlertCooldownManager } from './alert/AlertCooldownManager';
import { TemperatureChecker } from './alert/TemperatureChecker';
import { HumidityChecker } from './alert/HumidityChecker';
import { BinarySensorChecker } from './alert/BinarySensorChecker';
import { AlertBatchProcessor } from './alert/AlertBatchProcessor';
import { SystemErrorHandler } from './alert/SystemErrorHandler';
class AlertService {
	private config: AlertConfig;
	private cooldownManager: AlertCooldownManager;
	private temperatureChecker: TemperatureChecker;
	private humidityChecker: HumidityChecker;
	private binarySensorChecker: BinarySensorChecker;
	private batchProcessor: AlertBatchProcessor;
	private systemErrorHandler: SystemErrorHandler;
	constructor() {
		this.config = new AlertConfig();
		this.cooldownManager = new AlertCooldownManager();
		this.temperatureChecker = new TemperatureChecker();
		this.humidityChecker = new HumidityChecker();
		this.binarySensorChecker = new BinarySensorChecker();
		this.batchProcessor = new AlertBatchProcessor(this.config);
		this.systemErrorHandler = new SystemErrorHandler(this.config, this.batchProcessor.getPendingAlerts());
		this.initialize();
	}

	private async initialize(): Promise<void> {
		await this.config.loadConfiguration();
		this.batchProcessor.startBatchAlertTimer();
	}

	async checkSensorThresholds(sensorData: {
		temperature: number
		humidity: number
		soilMoisture: number
		waterLevel: number
	}): Promise<void> {
		const traceId = Math.random().toString(36).substr(2, 9);
		console.log(`🔍 [${traceId}] === ALERT THRESHOLD CHECK START ===`);
		console.log(`🔍 [${traceId}] Sensor data:`, {
			temperature: `${sensorData.temperature}°C`,
			humidity: `${sensorData.humidity}%`,
			soilMoisture: `${sensorData.soilMoisture} (${sensorData.soilMoisture === 0 ? 'DRY' : 'WET'})`,
			waterLevel: `${sensorData.waterLevel} (${sensorData.waterLevel === 0 ? 'NORMAL' : 'FLOOD'})`
		});

		const thresholds = this.config.getCurrentThresholds();
		if (!thresholds) {
			console.warn(`⚠️ [${traceId}] No thresholds configured, loading from database...`);
			await this.config.loadConfiguration();
		}

		if (!this.config.getCurrentThresholds()) {
			console.error(`❌ [${traceId}] No thresholds available after reload attempt`);
			return;
		}

		console.log(`📊 [${traceId}] Active thresholds:`, {
			temperature: this.config.getCurrentThresholds()?.temperatureThreshold,
			humidity: this.config.getCurrentThresholds()?.humidityThreshold,
			emailRecipients: this.config.getEmailRecipients().length,
			batchAlertsEnabled: this.config.isBatchAlertsEnabled()
		});
		const pendingAlerts = this.batchProcessor.getPendingAlerts();
		const initialPendingCount = pendingAlerts.length;

		console.log(`🔄 [${traceId}] Starting sequential threshold checks...`);
		console.log(`📧 [${traceId}] Current pending alerts: ${initialPendingCount}`);

		// Sequential execution to avoid duplicate alerts
		await this.temperatureChecker.checkTemperature(
			sensorData.temperature,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		console.log(`🌡️ [${traceId}] Temperature check completed (pending: ${pendingAlerts.length})`);

		await this.humidityChecker.checkHumidity(
			sensorData.humidity,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		console.log(`💧 [${traceId}] Humidity check completed (pending: ${pendingAlerts.length})`);

		await this.binarySensorChecker.checkSoilMoisture(
			sensorData.soilMoisture,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		console.log(`🌱 [${traceId}] Soil moisture check completed (pending: ${pendingAlerts.length})`);

		await this.binarySensorChecker.checkWaterLevel(
			sensorData.waterLevel,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		console.log(`💦 [${traceId}] Water level check completed (pending: ${pendingAlerts.length})`);

		const finalPendingCount = pendingAlerts.length;
		const newAlertsCount = finalPendingCount - initialPendingCount;

		if (newAlertsCount > 0) {
			console.log(`🚨 [${traceId}] ${newAlertsCount} new alert(s) generated and queued for processing`);
		} else {
			console.log(`✅ [${traceId}] No threshold violations detected - all values within normal ranges`);
		}

		console.log(`🔍 [${traceId}] === ALERT THRESHOLD CHECK END ===`);
	}

	async updateThresholds(newThresholds: Partial<ThresholdConfig>): Promise<void> {
		await this.config.updateThresholds(newThresholds);
	}

	getCurrentThresholds(): ThresholdConfig | null {
		return this.config.getCurrentThresholds();
	}

	async reloadThresholds(): Promise<void> {
		await this.config.loadConfiguration();
		this.batchProcessor.startBatchAlertTimer();
	}

	async handleSystemError(error: string, component: string): Promise<void> {
		await this.systemErrorHandler.handleSystemError(error, component);
	}

	async testEmailAlert(): Promise<boolean> {
		return await this.systemErrorHandler.testEmailAlert();
	}

	getEmailStatus(): { enabled: boolean; configured: boolean; recipients: number } {
		return this.systemErrorHandler.getEmailStatus();
	}
}

export const alertService = new AlertService();
export { AlertService, ThresholdConfig };
export type { ThresholdConfig as ThresholdConfigType };