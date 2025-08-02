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

		// Add filter parameters only if they have meaningful values
		if (filters.dateFrom && filters.dateFrom.trim()) params.dateFrom = filters.dateFrom;
		if (filters.dateTo && filters.dateTo.trim()) params.dateTo = filters.dateTo;
		if (filters.minTemperature && filters.minTemperature.trim()) params.minTemperature = parseFloat(filters.minTemperature);
		if (filters.maxTemperature && filters.maxTemperature.trim()) params.maxTemperature = parseFloat(filters.maxTemperature);
		if (filters.minHumidity && filters.minHumidity.trim()) params.minHumidity = parseFloat(filters.minHumidity);
		if (filters.maxHumidity && filters.maxHumidity.trim()) params.maxHumidity = parseFloat(filters.maxHumidity);
		if (filters.soilMoisture !== '' && filters.soilMoisture.trim()) params.soilMoisture = parseInt(filters.soilMoisture);
		if (filters.waterLevel !== '' && filters.waterLevel.trim()) params.waterLevel = parseInt(filters.waterLevel);
		if (filters.rainStatus !== '' && filters.rainStatus.trim()) params.rainStatus = filters.rainStatus === 'true';

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
