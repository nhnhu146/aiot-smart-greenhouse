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
			// Create timestamp from WebSocket data or current time
			const wsTimestamp = newSensorData.timestamp || newSensorData.createdAt || new Date().toISOString();

			// Check for duplicate timestamps to prevent duplicate entries
			const isDuplicate = prevData.some(item => {
				const itemTimestamp = item.timestamp || item.createdAt;
				if (!itemTimestamp) return false;

				// Increased tolerance to 30 seconds to handle merge operations
				return itemTimestamp === wsTimestamp ||
					Math.abs(new Date(itemTimestamp).getTime() - new Date(wsTimestamp).getTime()) < 30000; // 30 second tolerance
			});

			if (isDuplicate) {
				console.log('🔄 Skipping duplicate timestamp data:', wsTimestamp);
				return prevData;
			}

			// Helper function to check if value is valid (non-null and non-zero for numeric, non-null for others)
			const isValidValue = (value: any, field: string): boolean => {
				if (value === null || value === undefined) return false;

				// For boolean/status fields, 0 or false are valid states
				if (field === 'rainStatus') {
					return typeof value === 'boolean' || value === 0 || value === 1;
				}

				// For sensor readings, 0 might be valid in some cases but usually indicates sensor error
				// Allow 0 for soilMoisture and waterLevel as they can legitimately be 0
				if (field === 'soilMoisture' || field === 'waterLevel') {
					return typeof value === 'number' && value >= 0;
				}

				// For lightLevel, 0 might be valid (dark conditions)
				if (field === 'lightLevel') {
					return typeof value === 'number' && value >= 0;
				}

				// For temperature and humidity, 0 is suspicious but might be valid in extreme cases
				// For plantHeight, 0 is invalid (plants should have some height)
				if (field === 'temperature' || field === 'humidity') {
					return typeof value === 'number' && !isNaN(value) && value !== 0;
				}

				if (field === 'plantHeight') {
					return typeof value === 'number' && value > 0;
				}

				return true;
			};

			// Get the most recent data point to merge with (fallback to empty object for first data point)
			const lastDataPoint = prevData.length > 0 ? prevData[prevData.length - 1] : {};

			// Create new sensor data point from WebSocket data, only updating valid values
			// For first data point, only include valid values; for subsequent points, preserve existing values
			const newDataPoint: SensorData = {
				// Use existing value if new value is invalid, otherwise use new value (undefined for first point if invalid)
				...(isValidValue(newSensorData.temperature, 'temperature')
					? { temperature: newSensorData.temperature }
					: (lastDataPoint.temperature !== undefined ? { temperature: lastDataPoint.temperature } : {})),
				...(isValidValue(newSensorData.humidity, 'humidity')
					? { humidity: newSensorData.humidity }
					: (lastDataPoint.humidity !== undefined ? { humidity: lastDataPoint.humidity } : {})),
				...(isValidValue(newSensorData.soilMoisture, 'soilMoisture')
					? { soilMoisture: newSensorData.soilMoisture }
					: (lastDataPoint.soilMoisture !== undefined ? { soilMoisture: lastDataPoint.soilMoisture } : {})),
				...(isValidValue(newSensorData.waterLevel, 'waterLevel')
					? { waterLevel: newSensorData.waterLevel }
					: (lastDataPoint.waterLevel !== undefined ? { waterLevel: lastDataPoint.waterLevel } : {})),
				...(isValidValue(newSensorData.lightLevel, 'lightLevel')
					? { lightLevel: newSensorData.lightLevel }
					: (lastDataPoint.lightLevel !== undefined ? { lightLevel: lastDataPoint.lightLevel } : {})),
				...(isValidValue(newSensorData.plantHeight, 'plantHeight')
					? { plantHeight: newSensorData.plantHeight }
					: (lastDataPoint.plantHeight !== undefined ? { plantHeight: lastDataPoint.plantHeight } : {})),
				timestamp: wsTimestamp,
				createdAt: wsTimestamp
			};

			// Log which values were updated
			const updatedFields = [];
			if (isValidValue(newSensorData.temperature, 'temperature')) updatedFields.push(`temperature=${newSensorData.temperature}`);
			if (isValidValue(newSensorData.humidity, 'humidity')) updatedFields.push(`humidity=${newSensorData.humidity}`);
			if (isValidValue(newSensorData.soilMoisture, 'soilMoisture')) updatedFields.push(`soilMoisture=${newSensorData.soilMoisture}`);
			if (isValidValue(newSensorData.waterLevel, 'waterLevel')) updatedFields.push(`waterLevel=${newSensorData.waterLevel}`);
			if (isValidValue(newSensorData.lightLevel, 'lightLevel')) updatedFields.push(`lightLevel=${newSensorData.lightLevel}`);
			if (isValidValue(newSensorData.plantHeight, 'plantHeight')) updatedFields.push(`plantHeight=${newSensorData.plantHeight}`);

			// Only add new data point if at least one valid value was received
			if (updatedFields.length === 0) {
				console.log('🔄 Skipping WebSocket data - no valid sensor values:', wsTimestamp);
				return prevData;
			}

			// Add new data point and keep only maxDataPoints (sliding window)
			const updatedData = [...prevData, newDataPoint].slice(-maxDataPoints);
			console.log('📊 Added new chart data point:', {
				timestamp: wsTimestamp,
				updatedFields: updatedFields,
				dataCount: updatedData.length
			});
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
