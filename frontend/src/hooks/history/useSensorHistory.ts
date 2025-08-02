import { useState, useEffect } from 'react';
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

	const buildParams = () => {
		const params: any = {
			page: pagination.page,
			limit: pagination.limit,
			sortBy: sort.field,
			sortOrder: sort.direction
		};

		// Add filter parameters
		if (filters.dateFrom) params.dateFrom = filters.dateFrom;
		if (filters.dateTo) params.dateTo = filters.dateTo;
		if (filters.minTemperature) params.minTemperature = filters.minTemperature;
		if (filters.maxTemperature) params.maxTemperature = filters.maxTemperature;
		if (filters.minHumidity) params.minHumidity = filters.minHumidity;
		if (filters.maxHumidity) params.maxHumidity = filters.maxHumidity;
		if (filters.soilMoisture !== '') params.soilMoisture = filters.soilMoisture;
		if (filters.waterLevel !== '') params.waterLevel = filters.waterLevel;
		if (filters.rainStatus !== '') params.rainStatus = filters.rainStatus;

		return params;
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/history/sensors', { params });
			setData(response.data.data?.sensors || []);
			setPagination(response.data.data?.pagination || pagination);
		} catch (error) {
			console.error('Error fetching sensor data:', error);
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
