import { useState, useEffect, useRef } from 'react';
// Removed useWebSocketContext to prevent annoying refresh effects

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
	const [cachedData, setCachedData] = useState<SensorData[]>([]);

	const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
	// WebSocket context removed to prevent annoying refresh effects

	// Debouncing refs
	const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastFetchTimeRef = useRef<number>(0);
	const isInitialLoadRef = useRef<boolean>(true);

	const fetchData = async (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
		// Debounce: prevent multiple rapid calls
		const now = Date.now();
		if (now - lastFetchTimeRef.current < 1000 && !isInitialLoadRef.current) {
			return;
		}
		lastFetchTimeRef.current = now;

		// Clear any pending timeout
		if (fetchTimeoutRef.current) {
			clearTimeout(fetchTimeoutRef.current);
		}

		try {
			// Show cached data immediately for better UX
			if (cachedData.length > 0 && !isInitialLoadRef.current) {
				setData(cachedData);
			}

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

			// Increase limit to 50 data points for better chart visualization
			const response = await fetch(
				`${API_BASE_URL}/api/history/sensors?from=${from}&to=${to}&limit=50&sortBy=createdAt&sortOrder=desc`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success && result.data && result.data.sensors) {
				// The API returns data in result.data.sensors
				const rawData = Array.isArray(result.data.sensors) ? result.data.sensors : [result.data.sensors];

				// Filter out data with null timestamps and limit to appropriate number of points
				const validData = rawData
					.filter((item: SensorData) => {
						const timestamp = item.createdAt || item.timestamp;
						return timestamp && timestamp !== null && timestamp !== 'Invalid Date';
					})
					.map((item: SensorData) => ({
						...item,
						// Ensure proper timestamp format
						timestamp: item.createdAt || item.timestamp,
						createdAt: item.createdAt
					}))
					.slice(0, 50) // Increase to 50 data points for better visualization
					.reverse(); // Reverse to get chronological order

				setData(validData);
				setCachedData(validData); // Cache for next fetch
			} else {
				console.error('Invalid response format - API returned:', result);
				throw new Error(`API returned invalid format: missing data.sensors`);
			}
		} catch (err) {
						setError(err instanceof Error ? err.message : 'Unknown error');

			// Keep cached data on error for better UX
			if (cachedData.length > 0) {
				setData(cachedData);
			} else {
				setData([]);
			}
		} finally {
			setLoading(false);
			isInitialLoadRef.current = false;
		}
	};

	// Auto-fetch data on mount
	useEffect(() => {
		fetchData();
	}, []);

	// Disabled automatic WebSocket updates to prevent annoying refresh effects
	// Users can manually refresh using the refresh button if needed
	// useEffect(() => {
	// 	if (persistentSensorData && !isInitialLoadRef.current) {
	// 		// Clear existing timeout
	// 		if (fetchTimeoutRef.current) {
	// 			clearTimeout(fetchTimeoutRef.current);
	// 		}

	// 		// Set new timeout for debounced refresh
	// 		fetchTimeoutRef.current = setTimeout(() => {
	// 			fetchData();
	// 		}, 3000); // 3 second debounce
	// 	}

	// 	// Cleanup timeout on unmount
	// 	return () => {
	// 		if (fetchTimeoutRef.current) {
	// 			clearTimeout(fetchTimeoutRef.current);
	// 		}
	// 	};
	// }, [persistentSensorData]);

	return {
		data,
		loading,
		error,
		fetchData,
	};
};
