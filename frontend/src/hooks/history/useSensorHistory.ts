import { useState, useEffect, useCallback, useMemo } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';
import HistoryRequestManager from '@/utils/requestManager';

export const useSensorHistory = (
	filters: FilterState,
	sort: SortState,
	pagination: PaginationInfo,
	setPagination: (pagination: PaginationInfo) => void
) => {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Use centralized request manager
	const requestManager = useMemo(() => HistoryRequestManager.getInstance(), []);

	const buildSensorParams = useCallback(() => {
		const extraFilters: Record<string, any> = {};

		// Add sensor-specific filter parameters only if they have meaningful values
		if (filters.minTemperature?.trim()) extraFilters.minTemperature = parseFloat(filters.minTemperature);
		if (filters.maxTemperature?.trim()) extraFilters.maxTemperature = parseFloat(filters.maxTemperature);
		if (filters.minHumidity?.trim()) extraFilters.minHumidity = parseFloat(filters.minHumidity);
		if (filters.maxHumidity?.trim()) extraFilters.maxHumidity = parseFloat(filters.maxHumidity);
		if (filters.minSoilMoisture?.trim()) extraFilters.minSoilMoisture = parseFloat(filters.minSoilMoisture);
		if (filters.maxSoilMoisture?.trim()) extraFilters.maxSoilMoisture = parseFloat(filters.maxSoilMoisture);
		if (filters.minWaterLevel?.trim()) extraFilters.minWaterLevel = parseFloat(filters.minWaterLevel);
		if (filters.maxWaterLevel?.trim()) extraFilters.maxWaterLevel = parseFloat(filters.maxWaterLevel);
		if (filters.soilMoisture !== '' && filters.soilMoisture?.trim()) extraFilters.soilMoisture = parseInt(filters.soilMoisture);
		if (filters.waterLevel !== '' && filters.waterLevel?.trim()) extraFilters.waterLevel = parseInt(filters.waterLevel);
		if (filters.rainStatus !== '' && filters.rainStatus?.trim()) extraFilters.rainStatus = filters.rainStatus === 'true';

		return requestManager.buildHistoryParams(filters, sort, pagination, extraFilters);
	}, [filters, sort, pagination, requestManager]);

	const fetchData = useCallback(async (forceRefresh = false) => {
		if (forceRefresh) {
			requestManager.clearCache('/api/history/sensors');
		}

		setLoading(true);
		setError(null);

		try {
			const params = buildSensorParams();

			const response = await requestManager.makeRequest(
				async (requestParams) => {
					return await apiClient.get('/api/history/sensors', { 
						params: requestParams
					});
				},
				'/api/history/sensors',
				params
			);

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

			setData(newData);
			setPagination(paginationData);

		} catch (error: any) {
			console.error('Failed to fetch sensor history:', error);
			if (error.message !== 'Request was cancelled') {
				setError('Failed to load sensor data');
				setData([]);
			}
		} finally {
			setLoading(false);
		}
	}, [buildSensorParams, requestManager, pagination, setPagination]);

	// Effect to fetch data when dependencies change
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Global refresh function that can be called when settings change
	const refreshData = useCallback(() => {
		console.log('🔄 Refreshing sensor history data after settings change');
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

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			requestManager.cancelAllRequests();
		};
	}, [requestManager]);

	return {
		data,
		loading,
		error,
		refreshData
	};
};
