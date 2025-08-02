import { useState, useEffect } from 'react';
import { SensorData } from '@/services/mockDataService';
import mockDataService from '@/services/mockDataService';

export const useSensorData = (persistentSensorData: any, isConnected: boolean) => {
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Handle real-time persistent sensor data updates
	useEffect(() => {
		if (persistentSensorData) {
			const { temperature, humidity, soil } = persistentSensorData;

			// Create sensor data object from persistent state - always try to use persistent data
			const sensorDataObj: SensorData = {
				temperature: temperature?.value || 0,
				humidity: humidity?.value || 0,
				soilMoisture: soil?.value || 0, // Changed from 'moisture' to 'soilMoisture' to match backend
				timestamp: new Date().toISOString()
			};

			// Always update with persistent data if available, regardless of connection status
			if (temperature || humidity || soil) {
				setData(sensorDataObj);
				setIsUsingMockData(false);
				setIsLoading(false); // Stop loading once we have data
			}
		}
	}, [persistentSensorData]);

	// Initial data fetch
	useEffect(() => {
		let shutdownMockUpdates: (() => void) | null = null;

		const fetchData = async () => {
			try {
				// Check if mock data is enabled in settings
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					// Use mock data
					const result = await mockDataService.getSensorData();
					if (result.data) {
						setData(result.data);
						setIsUsingMockData(true);

						// Start mock data updates for realistic simulation
						shutdownMockUpdates = mockDataService.startMockDataUpdates(5000);
					}
				} else {
					// Use real data from API as fallback if no persistent data yet
					if (!persistentSensorData || !isConnected) {
						const result = await mockDataService.getSensorData();
						if (result.data) {
							setData(result.data);
							setIsUsingMockData(result.isMock);
						}
					}
				}

				setIsLoading(false);
			} catch (error) {
				console.error('Failed to fetch sensor data:', error);
				setIsLoading(false);
			}
		};

		fetchData();

		// Teardown function
		return () => {
			if (shutdownMockUpdates) {
				shutdownMockUpdates();
			}
		};
	}, [persistentSensorData, isConnected]);

	return {
		data,
		isUsingMockData,
		isLoading
	};
};
