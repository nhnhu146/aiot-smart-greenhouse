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

export const useSensorData = (persistentSensorData: any, isConnected: boolean) => {
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

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

	// Initial data fetch from API - no more mock fallbacks
	useEffect(() => {
		const fetchLatestSensorData = async () => {
			// Only fetch from API if we don't have persistent WebSocket data yet
			if (!persistentSensorData || Object.keys(persistentSensorData).length === 0) {
				try {
					setIsLoading(true);
					const response = await apiClient.get('/api/sensors/latest');

					if (response.data && response.data.success && response.data.data) {
						const apiData = response.data.data;
						const sensorDataObj: SensorData = {
							temperature: apiData.temperature || 0,
							humidity: apiData.humidity || 0,
							soilMoisture: apiData.soilMoisture || 0,
							waterLevel: apiData.waterLevel || 0,
							lightLevel: apiData.lightLevel || 0,
							rainStatus: apiData.rainStatus || 0,
							plantHeight: apiData.plantHeight || 0,
							timestamp: apiData.createdAt || new Date().toISOString(),
							_id: apiData._id,
							createdAt: apiData.createdAt,
							dataQuality: apiData.dataQuality
						};

						setData(sensorDataObj);
						setIsUsingMockData(false);
					}
				} catch (error) {
									} finally {
					setIsLoading(false);
				}
			} else {
				// We have WebSocket data, stop loading
				setIsLoading(false);
			}
		};

		fetchLatestSensorData();
	}, [persistentSensorData, isConnected]);

	return {
		data,
		isUsingMockData,
		isLoading
	};
};
