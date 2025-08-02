import { useState, useEffect } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';

interface VoiceCommand {
	id: string;
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

		if (filters.dateFrom) params.dateFrom = filters.dateFrom;
		if (filters.dateTo) params.dateTo = filters.dateTo;

		return params;
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const params = buildParams();
			const response = await apiClient.get('/api/voice-commands', { params });
			setData(response.data.data?.voiceCommands || response.data.data || []);
			setPagination(response.data.data?.pagination || response.data.pagination || pagination);
		} catch (error) {
			console.error('Error fetching voice commands:', error);
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
