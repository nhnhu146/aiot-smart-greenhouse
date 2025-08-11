// Mock data service for development and testing - DISPLAY ONLY
import { MockDataConfig } from './mock/MockDataConfig';
import { MockDataGenerator } from './mock/MockDataGenerator';
import type { SensorData, ChartDataPoint, DeviceControl } from './mock/MockDataTypes';

class MockDataService {
	private enabled: boolean = false;

	constructor() {
		this.enabled = MockDataConfig.isEnabled();
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		MockDataConfig.setEnabled(enabled);
	}

	// Backward compatibility method names
	isUsingMockData(): boolean {
		return this.enabled;
	}

	setUseMockData(enabled: boolean): void {
		this.setEnabled(enabled);
	}

	generateSensorData = (): SensorData => {
		return this.enabled ? MockDataGenerator.generateSensorData() : { temperature: 0, humidity: 0, soilMoisture: 0 };
	};

	generateChartData = (count: number = 24): ChartDataPoint[] => {
		return this.enabled ? MockDataGenerator.generateChartData(count) : [];
	};

	generateDeviceControls = (): DeviceControl[] => {
		return this.enabled ? MockDataGenerator.generateDeviceControls() : [];
	};

	startRealTimeData(callback: (data: SensorData) => void, interval: number = 5000) {
		if (!this.enabled) return () => { };

		const intervalId = setInterval(() => {
			callback(MockDataGenerator.generateSensorData());
		}, interval);

		return () => clearInterval(intervalId);
	}

	// Backward compatibility method
	async getSensorData(): Promise<{ data: SensorData | null; isMock: boolean }> {
		if (!this.enabled) {
			return { data: null, isMock: false };
		}

		return {
			data: MockDataGenerator.generateSensorData(),
			isMock: true
		};
	}

	// Backward compatibility method  
	startMockDataUpdates(intervalMs: number = 5000): () => void {
		return this.startRealTimeData(() => { }, intervalMs);
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
