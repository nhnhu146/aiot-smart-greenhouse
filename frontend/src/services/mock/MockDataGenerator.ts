import { SensorData, ChartDataPoint, DeviceControl } from './MockDataTypes';

/**
 * Mock data generator - Realistic greenhouse simulation data
 * Focused on data generation logic only
 */

export class MockDataGenerator {
	/**
	 * Generate current sensor data with realistic greenhouse values
	 */
	static generateSensorData(): SensorData {
		const variance = () => (Math.random() - 0.5) * 0.1;

		return {
			humidity: Math.max(0, Math.min(100, 65 + variance() * 15)),
			soilMoisture: Math.random() > 0.7 ? 0 : 1, // Binary: 30% dry, 70% wet
			temperature: Math.max(0, Math.min(50, 25 + variance() * 8)),
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Generate chart data for specified time range
	 */
	static generateChartData(hoursBack: number = 24): ChartDataPoint[] {
		const data: ChartDataPoint[] = [];
		const now = new Date();

		for (let i = hoursBack - 1; i >= 0; i--) {
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
				soilMoisture: Math.random() > 0.7 ? 0 : 1,
				waterLevel: Math.random() > 0.9 ? 1 : 0,
				lightLevel: Math.random() > 0.5 ? 1 : 0,
				plantHeight: 15 + Math.random() * 10,
				rainStatus: Math.random() > 0.8 ? 1 : 0
			});
		}

		return data;
	}

	/**
	 * Generate device control data
	 */
	static generateDeviceControls(count: number = 10): DeviceControl[] {
		const devices = ['light', 'pump', 'door', 'window'] as const;
		const actions = ['on', 'off', 'open', 'close'] as const;
		const controls: DeviceControl[] = [];

		for (let i = 0; i < count; i++) {
			const deviceType = devices[Math.floor(Math.random() * devices.length)];
			const action = actions[Math.floor(Math.random() * actions.length)];

			controls.push({
				_id: `mock_${Date.now()}_${i}`,
				deviceId: `device_${deviceType}_01`,
				deviceType,
				action,
				status: action === 'on' || action === 'open',
				controlType: Math.random() > 0.5 ? 'auto' : 'manual',
				triggeredBy: 'temperature_threshold',
				userId: 'mock_user',
				timestamp: new Date(Date.now() - i * 60000).toISOString(),
				success: Math.random() > 0.1 // 90% success rate
			});
		}

		return controls;
	}
}
