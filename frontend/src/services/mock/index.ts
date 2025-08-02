import { MockDataConfig } from './MockDataConfig';
import { MockDataGenerator } from './MockDataGenerator';
import { SensorData, ChartDataPoint, DeviceControl } from './MockDataTypes';

/**
 * Mock Data Service - User-controlled testing data provider
 * Complies with ban.instructions.md - only enabled by explicit user setting
 */

export class MockDataService {
	/**
	 * Check if mock data is currently enabled
	 */
	isUsingMockData(): boolean {
		return MockDataConfig.isEnabled();
	}

	/**
	 * Enable or disable mock data (user setting only)
	 */
	setUseMockData(enabled: boolean): void {
		MockDataConfig.setEnabled(enabled);
	}

	/**
	 * Get sensor data - only returns mock if explicitly enabled by user
	 */
	async getSensorData(): Promise<{ data: SensorData | null; isMock: boolean }> {
		if (!MockDataConfig.isEnabled()) {
			return { data: null, isMock: false };
		}

		return {
			data: MockDataGenerator.generateSensorData(),
			isMock: true
		};
	}

	/**
	 * Get chart data - only returns mock if explicitly enabled by user
	 */
	async getChartData(): Promise<{ data: ChartDataPoint[]; isMock: boolean }> {
		if (!MockDataConfig.isEnabled()) {
			return { data: [], isMock: false };
		}

		return {
			data: MockDataGenerator.generateChartData(),
			isMock: true
		};
	}

	/**
	 * Get device controls - only returns mock if explicitly enabled by user
	 */
	async getDeviceControls(): Promise<{ data: DeviceControl[]; isMock: boolean }> {
		if (!MockDataConfig.isEnabled()) {
			return { data: [], isMock: false };
		}

		return {
			data: MockDataGenerator.generateDeviceControls(),
			isMock: true
		};
	}

	/**
	 * Display current configuration for debugging
	 */
	getDebugInfo(): { enabled: boolean; source: string } {
		return {
			enabled: MockDataConfig.isEnabled(),
			source: 'User setting only - no automatic fallback'
		};
	}
}

// Export singleton instance
export const mockDataService = new MockDataService();

// Export types for external use
export type { SensorData, ChartDataPoint, DeviceControl };
