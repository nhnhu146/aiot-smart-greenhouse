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
	// Developer flag - set to false to disable mock data
	private useMockData: boolean = true;

	// Mock sensor data
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

		// Generate data for last 24 hours (every hour for more detailed history)
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

	// Toggle mock data (for development)
	public setUseMockData(enabled: boolean): void {
		this.useMockData = enabled;
		console.log(`Mock data ${enabled ? 'enabled' : 'disabled'}`);
	}

	public isUsingMockData(): boolean {
		return this.useMockData;
	}

	// Get sensor data with fallback to mock
	public async getSensorData(): Promise<{ data: SensorData | null; isMock: boolean }> {
		if (this.useMockData) {
			// Simulate some variance in mock data
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

		// Try to fetch real data
		try {
			const response = await fetch('/api/sensors/latest');
			if (response.ok) {
				const data = await response.json();
				return { data, isMock: false };
			} else {
				throw new Error(`API responded with status: ${response.status}`);
			}
		} catch (error) {
			console.warn('Failed to fetch real sensor data, falling back to mock:', error);

			// Fallback to mock data if real API fails
			return {
				data: this.mockSensorData,
				isMock: true
			};
		}
	}

	// Get chart data with fallback to mock
	public async getChartData(): Promise<{ data: ChartDataPoint[]; isMock: boolean }> {
		if (this.useMockData) {
			return {
				data: this.mockChartData,
				isMock: true
			};
		}

		// Try to fetch real data
		try {
			const response = await fetch('/api/history/sensors');
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

			// Fallback to mock data if real API fails
			return {
				data: this.mockChartData,
				isMock: true
			};
		}
	}

	// Update mock data (for testing different scenarios)
	public updateMockSensorData(data: Partial<SensorData>): void {
		this.mockSensorData = { ...this.mockSensorData, ...data };
	}

	// Simulate real-time updates to mock data
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

		// Return cleanup function
		return () => clearInterval(interval);
	}
}

// Export singleton instance
const mockDataService = new MockDataService();

// Development helper - expose to window for easy toggling in browser console
if (typeof window !== 'undefined') {
	(window as any).mockDataService = mockDataService;
	console.log('MockDataService available at window.mockDataService');
	console.log('Use window.mockDataService.setUseMockData(false) to disable mock data');
}

export default mockDataService;
export type { SensorData, ChartDataPoint };
