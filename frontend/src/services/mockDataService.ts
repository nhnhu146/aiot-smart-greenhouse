// Mock data service for development and testing - DISPLAY ONLY
interface SensorData {
	humidity: number;
	soilMoisture: number; // Changed from 'moisture' to 'soilMoisture' to match backend API
	temperature: number;
	timestamp?: string;
}

interface ChartDataPoint {
	time: string;
	temperature: number;
	humidity: number;
	soilMoisture: number;
	waterLevel?: number; // Binary: 0 = normal, 1 = flooded
	lightLevel?: number; // Binary: 0 = dark, 1 = bright
	plantHeight?: number; // Plant height in cm
	rainStatus?: number | boolean; // Rain status: 0/1 or false/true
}

interface DeviceControl {
	_id: string;
	deviceId: string;
	deviceType: 'light' | 'pump' | 'door' | 'window';
	action: 'on' | 'off' | 'open' | 'close';
	status: boolean;
	controlType: 'auto' | 'manual';
	triggeredBy?: string;
	userId?: string;
	timestamp: string;
	success: boolean;
}

class MockDataService {
	private useMockData: boolean;

	constructor() {
		// Frontend should prioritize real data - mock data only for testing
		const savedPreference = typeof localStorage !== 'undefined'
			? localStorage.getItem('useMockData')
			: null;

		// Default to false - real data first
		this.useMockData = false;

		// Only enable mock data if explicitly saved as true
		if (savedPreference === 'true') {
			this.useMockData = true;
		} else {
			this.useMockData = false;
		}
	}

	// Mock sensor data with realistic greenhouse values
	private mockSensorData: SensorData = {
		humidity: 65,
		soilMoisture: Math.random() > 0.7 ? 0 : 1, // Binary: 30% dry (0), 70% wet (1)
		temperature: 25,
		timestamp: new Date().toISOString()
	};

	// Mock chart data for last 24 hours
	private mockChartData: ChartDataPoint[] = this.generateMockChartData();

	private generateMockChartData(): ChartDataPoint[] {
		const data: ChartDataPoint[] = [];
		const now = new Date();

		for (let i = 23; i >= 0; i--) {
			const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
			data.push({
				time: timestamp.toLocaleString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
					timeZone: 'Asia/Ho_Chi_Minh'
				}),
				temperature: 20 + Math.random() * 15,
				humidity: 40 + Math.random() * 40,
				soilMoisture: Math.random() > 0.7 ? 0 : 1, // Binary: 30% dry, 70% wet
				waterLevel: Math.random() > 0.9 ? 1 : 0, // Binary: 10% flooded, 90% normal
				lightLevel: Math.random() > 0.5 ? 1 : 0, // Binary: random day/night
				plantHeight: 15 + Math.random() * 10,
				rainStatus: Math.random() > 0.8 ? 1 : 0 // Binary: 20% rain, 80% clear
			});
		}

		return data;
	}

	// Configuration methods
	public setUseMockData(enabled: boolean): void {
		this.useMockData = enabled;

		// Save to localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('useMockData', enabled.toString());
		}

		// Emit event for components that need to react
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('mockDataChanged', {
				detail: { enabled }
			}));
		}
	}

	public isUsingMockData(): boolean {
		return this.useMockData;
	}

	// Get sensor data with API fallback (DISPLAY ONLY - no processing/merge)
	public async getSensorData(): Promise<{ data: SensorData | null; isMock: boolean }> {
		if (this.useMockData) {
			// Add realistic variations to mock data
			const variance = () => (Math.random() - 0.5) * 0.1;

			return {
				data: {
					humidity: Math.max(0, Math.min(100, this.mockSensorData.humidity + variance() * 10)),
					soilMoisture: Math.max(0, Math.min(1, this.mockSensorData.soilMoisture)), // Keep binary 0/1
					temperature: Math.max(0, Math.min(50, this.mockSensorData.temperature + variance() * 5)),
					timestamp: new Date().toISOString()
				},
				isMock: true
			};
		}

		// Fetch real merged data from backend API (backend handles all merge logic)
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
			const response = await fetch(`${API_BASE_URL}/api/sensors/latest`);

			if (!response.ok) {
				console.error('Failed to fetch sensor data from API:', response.status);
				return { data: null, isMock: false };
			}

			const result = await response.json();
			if (result.success && result.data) {
				// Transform backend data to frontend format
				const transformedData: SensorData = {
					humidity: result.data.humidity || 0,
					soilMoisture: result.data.soilMoisture || 0,
					temperature: result.data.temperature || 0,
					timestamp: result.data.createdAt || new Date().toISOString()
				};

				return { data: transformedData, isMock: false };
			}

			return { data: null, isMock: false };
		} catch (error) {
			console.error('Error fetching sensor data:', error);
			return { data: null, isMock: false };
		}
	}

	// Get chart data with API fallback (DISPLAY ONLY - no processing/merge)
	public async getChartData(): Promise<{ data: ChartDataPoint[]; isMock: boolean }> {
		if (this.useMockData) {
			return {
				data: this.mockChartData,
				isMock: true
			};
		}

		// Fetch real merged data from backend API (backend handles all merge logic)
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
			const response = await fetch(`${API_BASE_URL}/api/history`);

			if (!response.ok) {
				console.error('Failed to fetch chart data from API:', response.status);
				return { data: [], isMock: false };
			}

			const result = await response.json();
			if (result.success && result.data && result.data.sensorHistory) {
				// Transform backend data to chart format
				const chartData: ChartDataPoint[] = result.data.sensorHistory.map((item: any) => ({
					time: new Date(item.createdAt || item.timestamp).toLocaleString('en-US', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: false,
						timeZone: 'Asia/Ho_Chi_Minh'
					}),
					temperature: item.temperature || 0,
					humidity: item.humidity || 0,
					soilMoisture: item.soilMoisture || 0,
					waterLevel: item.waterLevel || 0,
					lightLevel: item.lightLevel || 0,
					plantHeight: item.plantHeight || 0,
					rainStatus: item.rainStatus || 0
				}));

				return { data: chartData, isMock: false };
			}

			return { data: [], isMock: false };
		} catch (error) {
			console.error('Error fetching chart data:', error);
			return { data: [], isMock: false };
		}
	}

	// Update mock data for testing scenarios
	public updateMockSensorData(data: Partial<SensorData>): void {
		this.mockSensorData = { ...this.mockSensorData, ...data };
	}

	// Start mock data real-time updates
	public startMockDataUpdates(intervalMs: number = 5000): () => void {
		if (!this.useMockData) {
			return () => { };
		}


		const interval = setInterval(() => {
			// Update mock data with small variations
			this.mockSensorData = {
				...this.mockSensorData,
				humidity: Math.max(30, Math.min(90, this.mockSensorData.humidity + (Math.random() - 0.5) * 5)),
				temperature: Math.max(15, Math.min(35, this.mockSensorData.temperature + (Math.random() - 0.5) * 2)),
				soilMoisture: Math.random() > 0.7 ? 0 : 1, // Keep binary nature
				timestamp: new Date().toISOString()
			};

			// Emit update event
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('mockDataUpdate', {
					detail: { data: this.mockSensorData }
				}));
			}
		}, intervalMs);

		// Return shutdown function
		return () => {
			clearInterval(interval);
		};
	}
}

// Export singleton instance
const mockDataService = new MockDataService();

// Expose to window for browser console debugging
if (typeof window !== 'undefined') {
	(window as any).mockDataService = mockDataService;
}

export default mockDataService;
export type { SensorData, ChartDataPoint, DeviceControl };
