import { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { AppConstants, Config } from '../config/AppConfig';

interface SensorData {
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
	plantHeight?: number;
	timestamp?: string;
	createdAt?: string;
}

interface UseLineChartDataReturn {
	data: SensorData[];
	loading: boolean;
	error: string | null;
	fetchData: (limit?: number) => Promise<void>;
}

export const useLineChartData = (): UseLineChartDataReturn => {
	const [data, setData] = useState<SensorData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasInitialLoad, setHasInitialLoad] = useState(false);
	const maxDataPoints = 50; // Limit data points for performance

	const { socket } = useWebSocketContext();
	const API_BASE_URL = Config.api.baseUrl;

	// Track initial load to prevent excessive API calls
	const lastFetchTimeRef = useRef<number>(0);

	const fetchData = async (limit: number = maxDataPoints) => {
		// Only allow fetch on initial load or explicit user request (button click)
		const now = Date.now();
		if (hasInitialLoad && now - lastFetchTimeRef.current < AppConstants.REFRESH.CHART_DATA) {
			console.log('⏳ Fetch prevented - use WebSocket data for updates');
			return;
		}
		lastFetchTimeRef.current = now;

		try {
			setLoading(true);
			setError(null);

			// Get latest N records without time filtering - sort by createdAt desc to get most recent
			const response = await fetch(
				`${API_BASE_URL}/api/history/sensors?limit=${limit}&sortBy=createdAt&sortOrder=desc`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const result = await response.json();
			console.log('🔍 API Response:', { success: result.success, dataCount: result.data?.sensors?.length });

			if (result.success && result.data && result.data.sensors) {
				// Use standardized format - only data.sensors format is supported
				const rawDataArray = Array.isArray(result.data.sensors) ? result.data.sensors : [result.data.sensors];
				console.log('📊 Raw data count:', rawDataArray.length);

				// Filter and format data with proper validation
				const validData = rawDataArray
					.filter((item: SensorData) => {
						const timestamp = item.createdAt || item.timestamp;
						const isValid = timestamp && timestamp !== null && timestamp !== 'Invalid Date';
						if (!isValid) {
							console.warn('⚠️ Invalid timestamp for item:', item);
						}
						return isValid;
					})
					.map((item: SensorData) => ({
						...item,
						timestamp: item.createdAt || item.timestamp,
						createdAt: item.createdAt
					}))
					.slice(0, maxDataPoints)
					.reverse(); // Reverse to get chronological order

				console.log('✅ Valid data count:', validData.length);
				setData(validData);
				setHasInitialLoad(true);
			} else {
				console.error('❌ Invalid response format - API returned:', result);
				throw new Error(`API returned invalid format: missing data.sensors`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
			if (!hasInitialLoad) {
				setData([]);
			}
		} finally {
			setLoading(false);
		}
	};

	// Append new sensor data from WebSocket to existing array (optimized for performance)
	const appendWebSocketData = (newSensorData: any) => {
		if (!hasInitialLoad || !newSensorData) return;

		setData(prevData => {
			// Create new sensor data point from WebSocket data
			const newDataPoint: SensorData = {
				temperature: newSensorData.temperature,
				humidity: newSensorData.humidity,
				soilMoisture: newSensorData.soilMoisture,
				waterLevel: newSensorData.waterLevel,
				lightLevel: newSensorData.lightLevel,
				plantHeight: newSensorData.plantHeight,
				timestamp: new Date().toISOString(),
				createdAt: new Date().toISOString()
			};

			// Add new data point and keep only maxDataPoints (sliding window)
			const updatedData = [...prevData, newDataPoint].slice(-maxDataPoints);
			return updatedData;
		});
	};

	// Initial load only - no automatic refresh
	useEffect(() => {
		if (!hasInitialLoad) {
			fetchData();
		}
	}, []);

	// WebSocket data integration - append new data instead of full refetch
	useEffect(() => {
		if (!socket || !hasInitialLoad) return;

		const handleSensorData = (eventData: any) => {
			// Handle standardized WebSocket format: { success: true, data: { sensors: [...] } }
			if (eventData?.success && eventData?.data?.sensors && Array.isArray(eventData.data.sensors)) {
				const latestSensor = eventData.data.sensors[0];
				if (latestSensor) {
					appendWebSocketData(latestSensor);
				}
			}
		};

		socket.on('sensor:data', handleSensorData);

		return () => {
			socket.off('sensor:data', handleSensorData);
		};
	}, [socket, hasInitialLoad]);

	return {
		data,
		loading,
		error,
		fetchData,
	};
};
