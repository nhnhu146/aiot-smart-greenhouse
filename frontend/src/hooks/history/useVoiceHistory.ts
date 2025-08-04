import { useState, useEffect, useCallback, useMemo } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import apiClient from '@/lib/apiClient';
import HistoryRequestManager from '@/utils/requestManager';

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
	const [error, setError] = useState<string | null>(null);

	// Use centralized request manager
	const requestManager = useMemo(() => HistoryRequestManager.getInstance(), []);

	const buildVoiceParams = useCallback(() => {
		const extraFilters: Record<string, any> = {};

		// Add voice-specific filter parameters only if they have meaningful values
		if (filters.command?.trim()) extraFilters.command = filters.command;

		return requestManager.buildHistoryParams(filters, sort, pagination, extraFilters);
	}, [filters, sort, pagination, requestManager]);

	const fetchData = useCallback(async (forceRefresh = false) => {
		if (forceRefresh) {
			requestManager.clearCache('/api/voice-commands');
		}

		setLoading(true);
		setError(null);

		try {
			const params = buildVoiceParams();

			const response = await requestManager.makeRequest(
				async (requestParams) => {
					return await apiClient.get('/api/voice-commands', { 
						params: requestParams
					});
				},
				'/api/voice-commands',
				params
			);

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

		} catch (error: any) {
			console.error('Failed to fetch voice history:', error);
			if (error.message !== 'Request was cancelled') {
				setError('Failed to load voice command data');
				setData([]);
			}
		} finally {
			setLoading(false);
		}
	}, [buildVoiceParams, requestManager, pagination, setPagination]);

	// Effect to fetch data when dependencies change
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Global refresh function
	const refreshData = useCallback(() => {
		console.log('🔄 Refreshing voice history data');
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
