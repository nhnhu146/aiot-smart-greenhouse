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

class FrontendAutomationService {
	private config: AutomationConfig | null = null;
	private listeners: ((config: AutomationConfig) => void)[] = [];

	// Load automation config from backend
	async loadConfiguration(): Promise<AutomationConfig | null> {
		try {
			const response = await apiClient.getAutomationConfig();
			this.config = response.data;
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
			const response = await apiClient.updateAutomationConfig(newConfig);
			this.config = response.data;
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
}

export default new FrontendAutomationService();
