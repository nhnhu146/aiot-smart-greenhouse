const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
	private async request(endpoint: string, options: RequestInit = {}) {
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

	// Sensor Data APIs
	async getLatestSensorData(): Promise<SensorData> {
		return this.request('/api/sensors/latest');
	}

	async getSensorHistory(limit = 100): Promise<SensorData[]> {
		return this.request(`/api/sensors/history?limit=${limit}`);
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

export default new ApiClient();
