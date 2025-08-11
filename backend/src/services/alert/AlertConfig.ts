import { Settings } from '../../models';

export interface ThresholdConfig {
	temperatureThreshold: { min: number; max: number }
	humidityThreshold: { min: number; max: number }
	soilMoistureThreshold: { trigger: number } // Binary sensor: 0 = alert when dry, 1 = alert when wet
	waterLevelThreshold: { trigger: number } // Binary sensor: 0 = alert when empty, 1 = alert when full
}

export interface EmailAlertsConfig {
	temperature: boolean
	humidity: boolean
	soilMoisture: boolean
	waterLevel: boolean
}

export class AlertConfig {
	private currentThresholds: ThresholdConfig | null = null;
	private emailRecipients: string[] = [];
	private emailAlerts: EmailAlertsConfig = {
		temperature: true,
		humidity: true,
		soilMoisture: true,
		waterLevel: true
	};
	private alertFrequency: number = 5; // minutes
	private batchAlerts: boolean = true;
	async loadConfiguration(): Promise<void> {
		await this.loadThresholds();
		await this.loadEmailSettings();
	}

	async loadThresholds(): Promise<void> {
		try {
			const settings = await Settings.findOne().lean();
			if (settings) {
				this.currentThresholds = {
					temperatureThreshold: settings.temperatureThreshold,
					humidityThreshold: settings.humidityThreshold,
					// Handle migration from old min/max structure to new trigger structure
					soilMoistureThreshold: { 
						trigger: settings.soilMoistureThreshold?.trigger ?? 
								(settings.soilMoistureThreshold as any)?.min ?? 0 
					},
					waterLevelThreshold: { 
						trigger: settings.waterLevelThreshold?.trigger ?? 
								(settings.waterLevelThreshold as any)?.min ?? 0 
					}
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
			soilMoistureThreshold: { trigger: 0 }, // Alert when dry (0)
			waterLevelThreshold: { trigger: 0 } // Alert when empty (0)
		};
		console.log('🔧 Using default thresholds:', this.currentThresholds);
	}

	async loadEmailSettings(): Promise<void> {
		try {
			const settings = await Settings.findOne().lean();
			if (settings && settings.notifications?.emailRecipients) {
				this.emailRecipients = settings.notifications.emailRecipients;
				console.log(`📧 Email recipients loaded: ${this.emailRecipients.length} recipients`);
			} else {
				console.log('⚠️ No email recipients configured');
				this.emailRecipients = [];
			}

			if (settings && settings.emailAlerts) {
				this.emailAlerts = settings.emailAlerts;
				console.log('📧 Email alert settings loaded:', this.emailAlerts);
			} else {
				console.log('⚠️ No email alert settings found, using defaults');
			}

			if (settings && settings.notifications) {
				this.alertFrequency = (settings.notifications as any).alertFrequency || 5;
				this.batchAlerts = (settings.notifications as any).batchAlerts !== false;
				console.log(`⏰ Alert frequency: ${this.alertFrequency} minutes, Batch: ${this.batchAlerts}`);
			}
		} catch (error) {
			console.error('❌ Error loading email settings:', error);
			this.emailRecipients = [];
		}
	}

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

	getCurrentThresholds(): ThresholdConfig | null {
		return this.currentThresholds;
	}

	getEmailRecipients(): string[] {
		return this.emailRecipients;
	}

	getEmailAlerts(): EmailAlertsConfig {
		return this.emailAlerts;
	}

	getAlertFrequency(): number {
		return this.alertFrequency;
	}

	isBatchAlertsEnabled(): boolean {
		return this.batchAlerts;
	}
}
