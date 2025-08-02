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

		if (filters.dateFrom) params.dateFrom = filters.dateFrom;
		if (filters.dateTo) params.dateTo = filters.dateTo;
		if (filters.deviceType) params.deviceType = filters.deviceType;
		if (filters.controlType) params.action = filters.controlType;

		return params;
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/history/devices', { params });
			setData(response.data.data?.devices || []);
			setPagination(response.data.data?.pagination || pagination);
		} catch (error) {
			console.error('Error fetching device controls:', error);
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [filters, sort, pagination.page, pagination.limit]);

	return {
		data,
		loading,
		refresh: fetchData
	};
};
