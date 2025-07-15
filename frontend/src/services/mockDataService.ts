// Mock data service for development and testing
interface SensorData {
	humidity: number;
	moisture: number;
	temperature: number;
	timestamp?: string;
}

interface ChartDataPoint {
	time: string;
	temperature: number;
	humidity: number;
	soilMoisture: number;
}

class MockDataService {
	private useMockData: boolean;

	constructor() {
		// For production stability: always start with real data (false)
		// Users must manually enable mock data if needed
		const savedPreference = typeof localStorage !== 'undefined'
			? localStorage.getItem('useMockData')
			: null;

		// FORCE DEFAULT TO FALSE - mock data must be explicitly enabled
		this.useMockData = false;

		// If there was a saved preference and it was true, log but still default to false
		if (savedPreference === 'true') {
			console.log('⚠️ Previous mock data preference found but resetting to false for stability');
			// Clear the old preference
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('useMockData', 'false');
			}
		}

		// Debug log
		console.log('🔧 MockDataService initialized (FORCED DEFAULT):', {
			savedPreference,
			useMockData: this.useMockData,
			note: 'Always starts with real data for production stability'
		});
	}

	// Mock sensor data with realistic greenhouse values
	private mockSensorData: SensorData = {
		humidity: 65,
		moisture: 45,
		temperature: 25,
		timestamp: new Date().toISOString()
	};

	// Mock chart data for last 24 hours
	private mockChartData: ChartDataPoint[] = this.generateMockChartData();

	private generateMockChartData(): ChartDataPoint[] {
		const data: ChartDataPoint[] = [];
		const now = new Date();

		// Generate data for last 24 hours with realistic greenhouse variations
		for (let i = 23; i >= 0; i--) {
			const time = new Date(now.getTime() - i * 60 * 60 * 1000);
			data.push({
				time: time.toLocaleString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
				}),
				temperature: 20 + Math.random() * 15, // 20-35°C
				humidity: 40 + Math.random() * 40,    // 40-80%
				soilMoisture: 30 + Math.random() * 40  // 30-70%
			});
		}

		return data;
	}

	// Configuration methods
	public setUseMockData(enabled: boolean): void {
		this.useMockData = enabled;
		console.log(`🔧 Mock data ${enabled ? 'ENABLED' : 'DISABLED'} by user`);

		// Save preference to localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('useMockData', enabled.toString());
			console.log(`💾 Preference saved to localStorage: ${enabled}`);
		}

		// Trigger custom event for components to react
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('mockDataChanged', {
				detail: { enabled }
			}));
		}
	}

	public isUsingMockData(): boolean {
		return this.useMockData;
	}

	// Get sensor data with API fallback
	public async getSensorData(): Promise<{ data: SensorData | null; isMock: boolean }> {
		if (this.useMockData) {
			// Add realistic variations to mock data
			const variance = () => (Math.random() - 0.5) * 0.1;

			return {
				data: {
					humidity: Math.max(0, Math.min(100, this.mockSensorData.humidity + variance() * 10)),
					moisture: Math.max(0, Math.min(100, this.mockSensorData.moisture + variance() * 10)),
					temperature: Math.max(0, Math.min(50, this.mockSensorData.temperature + variance() * 5)),
					timestamp: new Date().toISOString()
				},
				isMock: true
			};
		}

		// Try to fetch real data from API
		try {
			const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
			const response = await fetch(`${API_BASE_URL}/api/sensors/latest`);
			if (response.ok) {
				const apiResponse = await response.json();

				// Map API response to expected format
				const data: SensorData = {
					humidity: apiResponse.data?.humidity || 0,
					moisture: apiResponse.data?.soilMoisture || 0,
					temperature: apiResponse.data?.temperature || 0,
					timestamp: apiResponse.data?.createdAt || new Date().toISOString()
				};

				return { data, isMock: false };
			} else {
				throw new Error(`API responded with status: ${response.status}`);
			}
		} catch (error) {
			console.warn('Failed to fetch real sensor data, falling back to mock:', error);
			// When API fails and mock is disabled, still return mock but mark as such
			return {
				data: this.mockSensorData,
				isMock: true
			};
		}
	}

	// Get chart data with API fallback
	public async getChartData(): Promise<{ data: ChartDataPoint[]; isMock: boolean }> {
		if (this.useMockData) {
			return {
				data: this.mockChartData,
				isMock: true
			};
		}

		// Try to fetch real chart data
		try {
			const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
			const response = await fetch(`${API_BASE_URL}/api/history/sensors`);
			if (response.ok) {
				const apiResponse = await response.json();

				// Map API response to ChartDataPoint format
				const mappedData: ChartDataPoint[] = apiResponse.data.sensors.map((sensor: any) => ({
					time: sensor.timestamp,
					temperature: sensor.temperature,
					humidity: sensor.humidity,
					soilMoisture: sensor.soilMoisture
				}));

				return { data: mappedData, isMock: false };
			} else {
				throw new Error(`API responded with status: ${response.status}`);
			}
		} catch (error) {
			console.warn('Failed to fetch real chart data, falling back to mock:', error);
			return {
				data: this.mockChartData,
				isMock: true
			};
		}
	}

	// Update mock data for testing scenarios
	public updateMockSensorData(data: Partial<SensorData>): void {
		this.mockSensorData = { ...this.mockSensorData, ...data };
	}

	// Start mock data real-time updates
	public startMockDataUpdates(intervalMs: number = 5000): () => void {
		const interval = setInterval(() => {
			if (this.useMockData) {
				// Simulate realistic sensor fluctuations
				const variance = () => (Math.random() - 0.5) * 2;

				this.mockSensorData = {
					...this.mockSensorData,
					humidity: Math.max(0, Math.min(100, this.mockSensorData.humidity + variance())),
					moisture: Math.max(0, Math.min(100, this.mockSensorData.moisture + variance())),
					temperature: Math.max(0, Math.min(50, this.mockSensorData.temperature + variance())),
					timestamp: new Date().toISOString()
				};
			}
		}, intervalMs);

		return () => clearInterval(interval);
	}
}

// Export singleton instance
const mockDataService = new MockDataService();

// Expose to window for browser console debugging
if (typeof window !== 'undefined') {
	(window as any).mockDataService = mockDataService;
	console.log('MockDataService available at window.mockDataService');
}

export default mockDataService;
export type { SensorData, ChartDataPoint };
