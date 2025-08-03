import { useState, useEffect } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';

export const useDeviceHistory = (
	filters: FilterState,
	sort: SortState,
	pagination: PaginationInfo,
	setPagination: (pagination: PaginationInfo) => void
) => {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

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
		if (filters.deviceType && filters.deviceType.trim()) params.deviceType = filters.deviceType;
		if (filters.controlType && filters.controlType.trim()) params.action = filters.controlType;

		return params;
	};

	const fetchData = async () => {
		// Debounce API calls - 5 seconds minimum between requests
		const now = Date.now();
		const MIN_INTERVAL = 5000;
		if (now - (window as any).__lastDeviceHistoryFetch < MIN_INTERVAL) {
			console.log('⏳ Device history fetch skipped - too soon');
			return;
		}
		(window as any).__lastDeviceHistoryFetch = now;

		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/history/device-controls', { params });

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
		} catch (error) {
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [
		filters.dateFrom,
		filters.dateTo,
		filters.deviceType,
		filters.command,
		sort.field,
		sort.direction,
		pagination.page,
		pagination.limit
	]);

	return {
		data,
		loading,
		refreshData: fetchData
	};
};
