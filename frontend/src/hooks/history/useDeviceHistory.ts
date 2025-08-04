import { useState, useEffect, useCallback, useMemo } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';
import HistoryRequestManager from '@/utils/requestManager';

export const useDeviceHistory = (
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

	const buildDeviceParams = useCallback(() => {
		const extraFilters: Record<string, any> = {};

		// Add device-specific filter parameters only if they have meaningful values
		if (filters.deviceType?.trim()) extraFilters.deviceType = filters.deviceType;
		if (filters.controlType?.trim()) extraFilters.action = filters.controlType;

		return requestManager.buildHistoryParams(filters, sort, pagination, extraFilters);
	}, [filters, sort, pagination, requestManager]);

	const fetchData = useCallback(async (forceRefresh = false) => {
		if (forceRefresh) {
			requestManager.clearCache('/api/history/device-controls');
		}

		setLoading(true);
		setError(null);

		try {
			const params = buildDeviceParams();

			const response = await requestManager.makeRequest(
				async (requestParams) => {
					return await apiClient.get('/api/history/device-controls', { 
						params: requestParams
					});
				},
				'/api/history/device-controls',
				params
			);

			// Handle the correct API response format
			const responseData = response.data || response;
			let newData = [];

			if (responseData.success && responseData.data && responseData.data.deviceControls) {
				newData = responseData.data.deviceControls;
			} else if (responseData.deviceControls) {
				newData = responseData.deviceControls;
			} else {
				console.error('Invalid device controls response format:', responseData);
				newData = [];
			}

			setData(newData);

			// Handle pagination
			const paginationData = responseData.data?.pagination || responseData.pagination || pagination;
			setPagination(paginationData);

		} catch (error: any) {
			console.error('Failed to fetch device history:', error);
			if (error.message !== 'Request was cancelled') {
				setError('Failed to load device control data');
				setData([]);
			}
		} finally {
			setLoading(false);
		}
	}, [buildDeviceParams, requestManager, pagination, setPagination]);

	// Effect to fetch data when dependencies change
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Global refresh function
	const refreshData = useCallback(() => {
		console.log('🔄 Refreshing device history data');
		fetchData(true); // Force refresh
	}, [fetchData]);

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
