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
		console.log(`[${traceId}] 👀 Checking thresholds for data:`, sensorData);
		const thresholds = this.config.getCurrentThresholds();
		if (!thresholds) {
			await this.config.loadConfiguration();
		}

		if (!this.config.getCurrentThresholds()) {
			console.error(`[${traceId}] ❌ No thresholds available for checking`);
			return;
		}

		console.log(`[${traceId}] 📊 Current thresholds:`, this.config.getCurrentThresholds());
		const pendingAlerts = this.batchProcessor.getPendingAlerts();
		// Sequential execution to avoid duplicate alerts
		await this.temperatureChecker.checkTemperature(
			sensorData.temperature,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		await this.humidityChecker.checkHumidity(
			sensorData.humidity,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		await this.binarySensorChecker.checkSoilMoisture(
			sensorData.soilMoisture,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
		await this.binarySensorChecker.checkWaterLevel(
			sensorData.waterLevel,
			traceId,
			this.config,
			this.cooldownManager,
			pendingAlerts
		);
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