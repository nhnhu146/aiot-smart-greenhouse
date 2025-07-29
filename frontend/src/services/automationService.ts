// Frontend automation service - communicates with backend API
import apiClient from '@/lib/apiClient';

interface AutomationConfig {
	enabled: boolean;
	lightControl: boolean;
	pumpControl: boolean;
	doorControl: boolean;
	windowControl: boolean;
	thresholds?: {
		lightLevel: number;
		soilMoisture: number;
		temperature: { min: number; max: number };
		humidity: { min: number; max: number };
	};
}

interface AutomationStatus {
	enabled: boolean;
	lastUpdate: string;
	activeControls: {
		light: boolean;
		pump: boolean;
		door: boolean;
		window: boolean;
	};
}

class FrontendAutomationService {
	private config: AutomationConfig | null = null;
	private listeners: ((config: AutomationConfig) => void)[] = [];

	// Load automation config from backend
	async loadConfiguration(): Promise<AutomationConfig | null> {
		try {
			const response = await apiClient.getAutomationConfig();

			// Map backend structure to frontend structure
			if (response.data) {
				this.config = {
					enabled: response.data.automationEnabled ?? false,
					lightControl: response.data.lightControlEnabled ?? true,
					pumpControl: response.data.pumpControlEnabled ?? true,
					doorControl: response.data.doorControlEnabled ?? false,
					windowControl: response.data.windowControlEnabled ?? true
				};
			}

			this.notifyListeners();
			return this.config;
		} catch (error) {
			console.error('Error loading automation config:', error);
			return null;
		}
	}

	// Update automation config via backend
	async updateConfiguration(newConfig: Partial<AutomationConfig>): Promise<boolean> {
		try {
			// Map frontend structure to backend structure
			const backendConfig: any = {};

			if (newConfig.enabled !== undefined) {
				backendConfig.automationEnabled = newConfig.enabled;
			}
			if (newConfig.lightControl !== undefined) {
				backendConfig.lightControlEnabled = newConfig.lightControl;
			}
			if (newConfig.pumpControl !== undefined) {
				backendConfig.pumpControlEnabled = newConfig.pumpControl;
			}
			if (newConfig.doorControl !== undefined) {
				backendConfig.doorControlEnabled = newConfig.doorControl;
			}
			if (newConfig.windowControl !== undefined) {
				backendConfig.windowControlEnabled = newConfig.windowControl;
			}

			const response = await apiClient.updateAutomationConfig(backendConfig);

			// Map backend response back to frontend structure
			if (response.data) {
				this.config = {
					enabled: response.data.automationEnabled ?? false,
					lightControl: response.data.lightControlEnabled ?? true,
					pumpControl: response.data.pumpControlEnabled ?? true,
					doorControl: response.data.doorControlEnabled ?? false,
					windowControl: response.data.windowControlEnabled ?? true
				};
			}

			this.notifyListeners();
			return true;
		} catch (error) {
			console.error('Error updating automation config:', error);
			return false;
		}
	}

	// Get current configuration
	getConfiguration(): AutomationConfig | null {
		return this.config;
	}

	// Add listener for config changes
	addListener(callback: (config: AutomationConfig) => void): void {
		this.listeners.push(callback);
	}

	// Remove listener
	removeListener(callback: (config: AutomationConfig) => void): void {
		this.listeners = this.listeners.filter(listener => listener !== callback);
	}

	// Notify all listeners
	private notifyListeners(): void {
		if (this.config) {
			this.listeners.forEach(listener => listener(this.config!));
		}
	}

	// Get automation status
	async getStatus(): Promise<any> {
		try {
			const response = await apiClient.getAutomationStatus();
			return response.data;
		} catch (error) {
			console.error('Error getting automation status:', error);
			return null;
		}
	}

	// Toggle automation enabled/disabled with immediate check
	async toggleAutomation(): Promise<boolean> {
		try {
			const currentConfig = this.config;
			if (!currentConfig) {
				console.error('No automation config available');
				return false;
			}

			const newEnabled = !currentConfig.enabled;
			const success = await this.updateConfiguration({ enabled: newEnabled });

			if (success && newEnabled) {
				// Trigger immediate automation check when enabled
				await this.triggerImmediateCheck();
			}

			return success;
		} catch (error) {
			console.error('Error toggling automation:', error);
			return false;
		}
	}

	// Trigger immediate automation check
	async triggerImmediateCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.getApiBaseUrl()}/api/automation/trigger`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();
			console.log('✅ Immediate automation check triggered:', result);
			return true;
		} catch (error) {
			console.error('Error triggering immediate automation check:', error);
			return false;
		}
	}

	// Trigger automation for specific sensor value (called from frontend)
	async triggerSensorAutomation(sensorType: string, value: number): Promise<boolean> {
		try {
			const response = await fetch(`${this.getApiBaseUrl()}/api/automation/sensor-trigger`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ sensorType, value })
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();
			console.log(`✅ Automation triggered for ${sensorType}:`, result);
			return true;
		} catch (error) {
			console.error(`Error triggering automation for ${sensorType}:`, error);
			return false;
		}
	}

	// Get API base URL
	private getApiBaseUrl(): string {
		return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
	}
}

const frontendAutomationService = new FrontendAutomationService();
export default frontendAutomationService;
