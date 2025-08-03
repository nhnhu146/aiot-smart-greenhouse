import { useState, useEffect } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';

interface VoiceCommand {
	_id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

export const useVoiceHistory = (
	filters: FilterState,
	sort: SortState,
	pagination: PaginationInfo,
	setPagination: (pagination: PaginationInfo) => void
) => {
	const [data, setData] = useState<VoiceCommand[]>([]);
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

		return params;
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/voice-commands', { params });

			// Handle the correct API response format
			const responseData = response.data || response;
			let newData = [];

			if (responseData.success && responseData.data) {
				newData = responseData.data.voiceCommands || responseData.data || [];
			} else if (responseData.voiceCommands) {
				newData = responseData.voiceCommands;
			} else {
				console.error('Invalid voice commands response format:', responseData);
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
		filters.command,
		sort.field,
		sort.direction,
		pagination.page,
		pagination.limit
	]);

	return {
		data,
		loading,
		refresh: fetchData
	};
};
