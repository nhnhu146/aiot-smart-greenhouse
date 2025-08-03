import { useState, useEffect, useRef, useCallback } from 'react';
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
	const lastFiltersRef = useRef<string>('');

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

	const fetchData = useCallback(async (forceRefresh = false) => {
		// Check if filters changed - if so, force refresh
		const currentFiltersStr = JSON.stringify(filters) + JSON.stringify(sort) + JSON.stringify(pagination);
		const filtersChanged = currentFiltersStr !== lastFiltersRef.current;
		lastFiltersRef.current = currentFiltersStr;

		// Prevent excessive API calls only if filters haven't changed
		const now = Date.now();
		const MIN_FETCH_INTERVAL = forceRefresh || filtersChanged ? 0 : 3000;
		if (!forceRefresh && !filtersChanged && (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL)) {
			console.log('⏳ Sensor history fetch skipped - too soon since last fetch');
			return;
		}
		lastFetchTimeRef.current = now;

		// Clear any pending timeout
		if (fetchTimeoutRef.current) {
			clearTimeout(fetchTimeoutRef.current);
		}

		// Only show cached data if filters haven't changed
		if (!filtersChanged && cachedData.length > 0) {
			setData(cachedData);
		}

		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/history/sensors', { params });

			// Standardized API response format handling - only support data.sensors format
			let newData = [];
			let paginationData = pagination;

			if (response && response.success && response.data) {
				if (response.data.sensors) {
					newData = response.data.sensors;
					paginationData = response.data.pagination || pagination;
				} else {
					console.warn('API response missing data.sensors format, using fallback');
					newData = [];
				}
			} else {
				console.warn('Invalid API response format');
				newData = [];
			}

			// Always update data and cache when we have a successful response
			setData(newData);
			setCachedData(newData);
			setPagination(paginationData);

		} catch (error) {
			console.error('Failed to fetch sensor history:', error);
			// On error, keep showing cached data if available
			if (cachedData.length === 0) {
				setData([]);
			}
		} finally {
			setLoading(false);
		}
	}, [filters, sort, pagination, cachedData, setPagination]);

	// Effect to fetch data when dependencies change
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Global refresh function that can be called when settings change
	const refreshData = useCallback(() => {
		console.log('🔄 Refreshing sensor history data after settings change');
		setCachedData([]); // Clear cache
		fetchData(true); // Force refresh
	}, [fetchData]);

	// Listen for custom refresh events (when settings change)
	useEffect(() => {
		const handleSettingsChange = () => {
			refreshData();
		};

		window.addEventListener('settingsChanged', handleSettingsChange);
		window.addEventListener('boardChanged', handleSettingsChange);

		return () => {
			window.removeEventListener('settingsChanged', handleSettingsChange);
			window.removeEventListener('boardChanged', handleSettingsChange);
		};
	}, [refreshData]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (fetchTimeoutRef.current) {
				clearTimeout(fetchTimeoutRef.current);
			}
		};
	}, []);

	return {
		data,
		loading,
		refreshData
	};
};
