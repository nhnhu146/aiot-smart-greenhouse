import { AutomationSettings, IAutomationSettings } from '../../models';

export class AutomationConfig {
	private config: IAutomationSettings | null = null;
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

	async reloadConfiguration(): Promise<void> {
		console.log('🔄 Reloading automation configuration...');
		await this.loadConfiguration();
	}

	async updateConfiguration(newConfig: Partial<IAutomationSettings>): Promise<void> {
		try {
			const updatedSettings = await AutomationSettings.findOneAndUpdate(
				{ /* TODO: Implement */ },
				newConfig,
				{
					new: true,
					upsert: true,
					runValidators: true
				}
			);
			if (updatedSettings) {
				this.config = updatedSettings;
				console.log('🔧 Automation configuration updated:', newConfig);
			}
		} catch (error) {
			console.error('❌ Failed to update automation configuration:', error);
			throw error;
		}
	}

	getConfig(): IAutomationSettings | null {
		return this.config;
	}

	isEnabled(): boolean {
		return this.config?.automationEnabled ?? false;
	}

	isLightControlEnabled(): boolean {
		return this.config?.lightControlEnabled ?? false;
	}

	isPumpControlEnabled(): boolean {
		return this.config?.pumpControlEnabled ?? false;
	}

	isDoorControlEnabled(): boolean {
		return this.config?.doorControlEnabled ?? false;
	}

	isWindowControlEnabled(): boolean {
		return this.config?.windowControlEnabled ?? false;
	}
}
