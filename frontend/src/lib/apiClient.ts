const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface SensorData {
	_id?: string;
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	lightLevel?: number;
	waterLevel?: number;
	timestamp?: string;
}

export interface DeviceStatus {
	device_name: string;
	status: string;
	timestamp?: string;
}

class ApiClient {
	private async request(endpoint: string, options: any = {}) {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}${endpoint}`, {
				headers: {
					'Content-Type': 'application/json',
					...(token && { 'Authorization': `Bearer ${token}` }),
					...options.headers,
				},
				...options,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error(`API request failed: ${endpoint}`, error);
			throw error;
		}
	}

	// Generic GET method with query parameters
	async get(endpoint: string, options: { params?: Record<string, any> } = {}) {
		let url = endpoint;

		if (options.params) {
			const searchParams = new URLSearchParams();
			Object.entries(options.params).forEach(([key, value]) => {
				// More strict filtering: exclude undefined, null, empty strings, and whitespace-only strings
				if (value !== undefined && value !== null && value !== '' && String(value).trim() !== '') {
					searchParams.append(key, String(value));
				}
			});
			const queryString = searchParams.toString();
			if (queryString) {
				url += (url.includes('?') ? '&' : '?') + queryString;
			}
		}

		return this.request(url);
	}

	// Generic POST method
	async post(endpoint: string, data?: any) {
		return this.request(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	// Generic PUT method
	async put(endpoint: string, data?: any) {
		return this.request(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	// Sensor Data APIs
	async getLatestSensorData(): Promise<SensorData> {
		return this.request('/api/sensors/latest');
	}

	async getSensorHistory(limit = 100): Promise<SensorData[]> {
		return this.request(`/api/history/sensors?limit=${limit}`);
	}

	async sendSensorData(data: Omit<SensorData, '_id' | 'timestamp'>): Promise<{ success: boolean; id: string; message: string }> {
		return this.request('/api/sensors', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Settings APIs
	async getSettings(): Promise<any> {
		return this.request('/api/settings');
	}

	async saveSettings(settings: any): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings', {
			method: 'POST',
			body: JSON.stringify(settings),
		});
	}

	// New threshold and email APIs
	async saveThresholds(thresholds: any): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings/thresholds', {
			method: 'POST',
			body: JSON.stringify(thresholds),
		});
	}

	async saveEmailRecipients(recipients: string[]): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings/email-recipients', {
			method: 'POST',
			body: JSON.stringify({ recipients }),
		});
	}

	async saveEmailAlerts(emailAlerts: any): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings/email-alerts', {
			method: 'POST',
			body: JSON.stringify(emailAlerts),
		});
	}

	async saveAlertFrequencySettings(settings: { alertFrequency: number; batchAlerts: boolean }): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings/alert-frequency', {
			method: 'POST',
			body: JSON.stringify(settings),
		});
	}

	async testEmail(recipients: string[]): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings/test-email', {
			method: 'POST',
			body: JSON.stringify({ recipients }),
		});
	}

	async getEmailStatus(): Promise<{ success: boolean; data: any }> {
		return this.request('/api/settings/email-status');
	}

	async resetSettings(): Promise<{ success: boolean; message: string }> {
		return this.request('/api/settings/reset', {
			method: 'POST',
		});
	}

	// Automation APIs
	async getAutomationConfig(): Promise<any> {
		return this.request('/api/automation');
	}

	async updateAutomationConfig(config: any): Promise<any> {
		return this.request('/api/automation', {
			method: 'PUT',
			body: JSON.stringify(config),
		});
	}

	async getAutomationStatus(): Promise<any> {
		return this.request('/api/automation/status');
	}

	// Chat API (using backend instead of Hugging Face)
	async askQuestion(question: string): Promise<any> {
		return this.request('/api/chat', {
			method: 'POST',
			body: JSON.stringify({ question }),
		});
	}

	// Health check
	async healthCheck(): Promise<any> {
		return this.request('/api/health');
	}
}

const apiClient = new ApiClient();
export default apiClient;
