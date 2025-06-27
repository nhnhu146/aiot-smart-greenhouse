// Mock data for dashboard when API is not available
export interface SensorData {
	humidity: number;
	moisture: number;
	temperature: number;
	timestamp?: string;
}

export const mockSensorData: SensorData = {
	humidity: 65,
	moisture: 2800, // Raw sensor value (0-4095)
	temperature: 24.5,
	timestamp: new Date().toISOString()
};

// Generate random sensor data for testing
export const generateMockSensorData = (): SensorData => {
	return {
		humidity: Math.round(Math.random() * 40 + 40), // 40-80%
		moisture: Math.round(Math.random() * 1500 + 2000), // 2000-3500 (raw value)
		temperature: Math.round((Math.random() * 15 + 18) * 10) / 10, // 18-33°C with 1 decimal
		timestamp: new Date().toISOString()
	};
};

// Historical data for charts
export const mockHistoricalData = {
	labels: [
		'6:00', '7:00', '8:00', '9:00', '10:00', '11:00',
		'12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
	],
	temperature: [18.5, 19.2, 21.8, 24.1, 26.3, 28.5, 30.1, 29.8, 28.2, 26.7, 24.3, 22.1],
	humidity: [75, 72, 68, 62, 58, 55, 52, 54, 58, 62, 67, 71],
	soilMoisture: [65, 63, 61, 58, 55, 52, 48, 46, 50, 54, 58, 62]
};

// Activity data for dashboard
export const mockActivityData = [
	{
		id: 1,
		type: 'watering',
		message: 'Automatic watering activated',
		timestamp: '2 minutes ago',
		status: 'success'
	},
	{
		id: 2,
		type: 'alert',
		message: 'Temperature threshold exceeded',
		timestamp: '15 minutes ago',
		status: 'warning'
	},
	{
		id: 3,
		type: 'system',
		message: 'System health check completed',
		timestamp: '1 hour ago',
		status: 'info'
	},
	{
		id: 4,
		type: 'sensor',
		message: 'Humidity sensor calibrated',
		timestamp: '2 hours ago',
		status: 'success'
	}
];

const mockData = {
	mockSensorData,
	generateMockSensorData,
	mockHistoricalData,
	mockActivityData
};

export default mockData;
