import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

export interface SensorData {
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
	rainStatus?: number | boolean;
	plantHeight?: number;
	timestamp: string;
	_id?: string;
	createdAt?: string;
	dataQuality?: string;
}

export const useSensorData = (persistentSensorData: any) => {
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Track configuration for mock data usage
	const [mockDataEnabled, setMockDataEnabled] = useState(false);

	// Handle real-time persistent sensor data updates
	useEffect(() => {
		if (persistentSensorData) {
			const { temperature, humidity, soil, water, light, rain, height } = persistentSensorData;

			// Create sensor data object from persistent state - always try to use persistent data
			const sensorDataObj: SensorData = {
				temperature: temperature?.value || 0,
				humidity: humidity?.value || 0,
				soilMoisture: soil?.value || 0,
				waterLevel: water?.value || 0,
				lightLevel: light?.value || 0,
				rainStatus: rain?.value || 0,
				plantHeight: height?.value || 0,
				timestamp: new Date().toISOString()
			};

			// Always update with persistent data if available, regardless of connection status
			if (temperature || humidity || soil || water || light || rain || height) {
				setData(sensorDataObj);
				setIsUsingMockData(false);
				setIsLoading(false); // Stop loading once we have data
			}
		}
	}, [persistentSensorData]);

	// Check for mock data configuration (user setting only)
	useEffect(() => {
		const checkMockDataConfig = () => {
			try {
				const mockConfig = localStorage.getItem('mockDataEnabled');
				const isConfigEnabled = mockConfig === 'true';
				setMockDataEnabled(isConfigEnabled);

				// Only enable mock data if explicitly configured by user
				if (isConfigEnabled && !persistentSensorData) {
					const mockSensorData = generateMockData();
					setData(mockSensorData);
					setIsUsingMockData(true);
				}
			} catch (error) {
				console.warn('Could not read mock data configuration:', error);
				setMockDataEnabled(false);
			}
		};

		checkMockDataConfig();
	}, [persistentSensorData]);

	// Generate mock data only when configured by user
	const generateMockData = (): SensorData => {
		return {
			temperature: 20 + Math.random() * 15,
			humidity: 40 + Math.random() * 40,
			soilMoisture: Math.random() > 0.7 ? 0 : 1,
			waterLevel: Math.random() > 0.9 ? 1 : 0,
			lightLevel: Math.random() > 0.5 ? 1 : 0,
			rainStatus: Math.random() > 0.8 ? 1 : 0,
			plantHeight: 15 + Math.random() * 10,
			timestamp: new Date().toISOString(),
			dataQuality: 'mock'
		};
	};

	// Initial data fetch from API - only once on mount or when explicitly requested
	const [hasInitialFetch, setHasInitialFetch] = useState(false);

	useEffect(() => {
		const fetchLatestSensorData = async () => {
			// Only fetch from API if:
			// 1. We haven't done initial fetch yet
			// 2. AND we don't have persistent WebSocket data
			if (!hasInitialFetch && (!persistentSensorData || Object.keys(persistentSensorData).length === 0)) {
				try {
					setIsLoading(true);
					const response = await apiClient.get('/api/sensors/latest');

					if (response.data && response.data.success && response.data.data && response.data.data.sensors) {
						// Standardized format: only use data.sensors[0]
						const sensorData = response.data.data.sensors[0];

						if (sensorData && typeof sensorData === 'object') {
							const sensorDataObj: SensorData = {
								temperature: sensorData.temperature || 0,
								humidity: sensorData.humidity || 0,
								soilMoisture: sensorData.soilMoisture || 0,
								waterLevel: sensorData.waterLevel || 0,
								lightLevel: sensorData.lightLevel || 0,
								rainStatus: sensorData.rainStatus || 0,
								plantHeight: sensorData.plantHeight || 0,
								timestamp: sensorData.createdAt || sensorData.timestamp || new Date().toISOString(),
								createdAt: sensorData.createdAt,
								dataQuality: sensorData.dataQuality
							};

							setData(sensorDataObj);
							setIsUsingMockData(false);
						}
					} else {
						console.warn('API response missing data.sensors format');
					}
				} catch (error) {
					console.warn('API fetch failed, keeping existing data:', error);
				} finally {
					setIsLoading(false);
					setHasInitialFetch(true);
				}
			} else if (persistentSensorData && Object.keys(persistentSensorData).length > 0) {
				// We have WebSocket data, stop loading and mark as fetched
				setIsLoading(false);
				setHasInitialFetch(true);
			}
		};

		// Only trigger on mount or when explicitly requested (page reload)
		// Check if this is a fresh page load by examining hasInitialFetch
		if (!hasInitialFetch) {
			fetchLatestSensorData();
		}
	}, []); // Remove all dependencies to prevent re-fetching - only fetch on mount

	return {
		data,
		isUsingMockData: isUsingMockData || mockDataEnabled,
		isLoading
	};
};
