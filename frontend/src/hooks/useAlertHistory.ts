import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

export interface AlertHistoryItem {
	_id: string;
	type: string;
	level: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	value?: number;
	timestamp: string;
	acknowledged: boolean;
	acknowledgedAt?: string;
}

interface AlertPaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface AlertFilters {
	dateFrom: string;
	dateTo: string;
	severity: string;
	type: string;
	acknowledged: string;
	pageSize: string;
}

export const useAlertHistory = (
	filters: AlertFilters,
	sort: { field: string; direction: 'asc' | 'desc' },
	pagination: AlertPaginationInfo,
	setPagination: (info: AlertPaginationInfo) => void
) => {
	const [data, setData] = useState<AlertHistoryItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			params.append('page', pagination.page.toString());
			params.append('limit', pagination.limit.toString());
			params.append('sortBy', sort.field);
			params.append('sortOrder', sort.direction);

			// Apply filters - only non-empty values
			Object.entries(filters).forEach(([key, value]) => {
				if (value && value.trim() !== '' && key !== 'pageSize') {
					params.append(key, value);
				}
			});

			const response = await apiClient.get(`/api/alert-history?${params.toString()}`);

			if (response.data.success) {
				setData(response.data.data);
				setPagination(response.data.pagination);
			} else {
				setError('Failed to fetch alert history');
			}

		} catch (err) {
			console.error('Error fetching alert history:', err);
			setError(err instanceof Error ? err.message : 'Unknown error occurred');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [filters, sort, pagination.page, pagination.limit]);

	const acknowledgeAlert = async (alertId: string) => {
		try {
			await apiClient.put(`/api/alert-history/${alertId}/acknowledge`);
			// Refresh data after acknowledgment
			await fetchData();
		} catch (err) {
			console.error('Error acknowledging alert:', err);
			throw err;
		}
	};

	const refresh = () => {
		fetchData();
	};

	return {
		data,
		loading,
		error,
		refresh,
		acknowledgeAlert
	};
};
