import { useState, useEffect, useRef } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';

export const useSensorHistory = (
	filters: FilterState,
	sort: SortState,
	pagination: PaginationInfo,
	setPagination: (pagination: PaginationInfo) => void
) => {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [cachedData, setCachedData] = useState<any[]>([]);

	// Debouncing refs
	const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastFetchTimeRef = useRef<number>(0);

	const buildParams = () => {
		const params: any = {
			page: pagination.page,
			limit: pagination.limit,
			sortBy: sort.field,
			sortOrder: sort.direction
		};

		// Add filter parameters only if they have meaningful values
		if (filters.dateFrom && filters.dateFrom.trim()) params.dateFrom = filters.dateFrom;
		if (filters.dateTo && filters.dateTo.trim()) params.dateTo = filters.dateTo;
		if (filters.minTemperature && filters.minTemperature.trim()) params.minTemperature = parseFloat(filters.minTemperature);
		if (filters.maxTemperature && filters.maxTemperature.trim()) params.maxTemperature = parseFloat(filters.maxTemperature);
		if (filters.minHumidity && filters.minHumidity.trim()) params.minHumidity = parseFloat(filters.minHumidity);
		if (filters.maxHumidity && filters.maxHumidity.trim()) params.maxHumidity = parseFloat(filters.maxHumidity);
		if (filters.minSoilMoisture && filters.minSoilMoisture.trim()) params.minSoilMoisture = parseFloat(filters.minSoilMoisture);
		if (filters.maxSoilMoisture && filters.maxSoilMoisture.trim()) params.maxSoilMoisture = parseFloat(filters.maxSoilMoisture);
		if (filters.minWaterLevel && filters.minWaterLevel.trim()) params.minWaterLevel = parseFloat(filters.minWaterLevel);
		if (filters.maxWaterLevel && filters.maxWaterLevel.trim()) params.maxWaterLevel = parseFloat(filters.maxWaterLevel);
		if (filters.soilMoisture !== '' && filters.soilMoisture.trim()) params.soilMoisture = parseInt(filters.soilMoisture);
		if (filters.waterLevel !== '' && filters.waterLevel.trim()) params.waterLevel = parseInt(filters.waterLevel);
		if (filters.rainStatus !== '' && filters.rainStatus.trim()) params.rainStatus = filters.rainStatus === 'true';

		return params;
	};

	const fetchData = async () => {
		// Debounce: prevent multiple rapid calls
		const now = Date.now();
		if (now - lastFetchTimeRef.current < 500) {
			return;
		}
		lastFetchTimeRef.current = now;

		// Clear any pending timeout
		if (fetchTimeoutRef.current) {
			clearTimeout(fetchTimeoutRef.current);
		}

		// Show cached data immediately for better UX
		if (cachedData.length > 0) {
			setData(cachedData);
		}

		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/history/sensors', { params });

			// Handle both possible response formats
			const responseData = response.data || response;
			const newData = responseData.sensors || responseData.data?.sensors || [];

			setData(newData);
			setCachedData(newData); // Cache for next fetch
			setPagination(responseData.pagination || responseData.data?.pagination || pagination);
		} catch (error) {
			console.error('Error fetching sensor data:', error);
			// Keep cached data on error for better UX
			if (cachedData.length > 0) {
				setData(cachedData);
			} else {
				setData([]);
			}
		} finally {
			setLoading(false);
		}
	};

	// Debounced useEffect to prevent excessive API calls
	useEffect(() => {
		// Clear existing timeout
		if (fetchTimeoutRef.current) {
			clearTimeout(fetchTimeoutRef.current);
		}

		// Set new timeout for debounced fetch
		fetchTimeoutRef.current = setTimeout(() => {
			fetchData();
		}, 300); // 300ms debounce

		// Cleanup timeout on unmount
		return () => {
			if (fetchTimeoutRef.current) {
				clearTimeout(fetchTimeoutRef.current);
			}
		};
	}, [filters, sort, pagination.page, pagination.limit]);

	return {
		data,
		loading,
		refresh: fetchData
	};
};
