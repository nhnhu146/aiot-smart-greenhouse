import { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface SensorData {
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
	timestamp?: string;
	createdAt?: string;
}

interface UseLineChartDataReturn {
	data: SensorData[];
	loading: boolean;
	error: string | null;
	fetchData: (timeRange?: '1h' | '24h' | '7d' | '30d') => Promise<void>;
}

export const useLineChartData = (): UseLineChartDataReturn => {
	const [data, setData] = useState<SensorData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
	const { persistentSensorData } = useWebSocketContext(); // Listen for WebSocket updates

	const fetchData = async (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
		try {
			setLoading(true);
			setError(null);

			// Calculate time range
			const now = new Date();
			const timeRanges = {
				'1h': 1 * 60 * 60 * 1000,
				'24h': 24 * 60 * 60 * 1000,
				'7d': 7 * 24 * 60 * 60 * 1000,
				'30d': 30 * 24 * 60 * 60 * 1000,
			};

			const from = new Date(now.getTime() - timeRanges[timeRange]).toISOString();
			const to = now.toISOString();

			const response = await fetch(
				`${API_BASE_URL}/api/history/sensors?from=${from}&to=${to}&limit=20&sortBy=createdAt&sortOrder=desc`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success && result.data && result.data.sensors) {
				// The API returns data in result.data.sensors
				const rawData = Array.isArray(result.data.sensors) ? result.data.sensors : [result.data.sensors];

				// Filter out data with null timestamps and limit to 20 points
				const validData = rawData
					.filter((item: SensorData) => {
						const timestamp = item.createdAt || item.timestamp;
						return timestamp && timestamp !== null;
					})
					.slice(0, 20) // Ensure maximum 20 data points
					.reverse(); // Reverse to get chronological order

				setData(validData);
			} else {
				throw new Error(`Invalid response format: ${JSON.stringify(result)}`);
			}
		} catch (err) {
			console.error('Error fetching line chart data:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');

			// Don't use mock data - show empty chart if API fails
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	// Auto-fetch data on mount
	useEffect(() => {
		fetchData();
	}, []);

	// Listen for WebSocket updates and refresh chart data to avoid duplicate timestamps
	useEffect(() => {
		if (persistentSensorData) {
			// When new sensor data comes via WebSocket, refresh chart data from API
			// This ensures no duplicate timestamps and maintains data integrity
			fetchData();
		}
	}, [persistentSensorData]);

	return {
		data,
		loading,
		error,
		fetchData,
	};
};
