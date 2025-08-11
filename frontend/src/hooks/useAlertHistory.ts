import { useState, useEffect, useRef } from 'react';
import apiClient from '@/lib/apiClient';
import { AppConstants } from '../config/AppConfig';

export interface AlertHistoryItem {
	_id: string;
	type: string;
	level: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	value?: number;
	createdAt: string;
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

	// Debouncing and rate limiting to prevent excessive API calls
	const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastFetchTimeRef = useRef<number>(0);

	const fetchData = async () => {
		// Prevent excessive API calls - minimum 3 seconds between requests
		const now = Date.now();
		const MIN_FETCH_INTERVAL = AppConstants.UI.DEBOUNCE_DELAY * 10;
		if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
			console.log('⏳ Alert history fetch skipped - too soon since last fetch');
			return;
		}
		lastFetchTimeRef.current = now;

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

			if (response.success) {
				setData(response.data || []);
				setPagination(response.pagination || {
					page: 1,
					limit: 20,
					total: 0,
					totalPages: 0,
					hasNext: false,
					hasPrev: false
				});
			} else {
				setError('Failed to fetch alert history');
			}

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error occurred');
		} finally {
			setLoading(false);
		}
	};

	// Debounced effect to reduce API calls
	useEffect(() => {
		// Clear any pending timeout
		if (fetchTimeoutRef.current) {
			clearTimeout(fetchTimeoutRef.current);
		}

		// Debounce the fetchData call to prevent excessive API calls
		fetchTimeoutRef.current = setTimeout(() => {
			fetchData();
		}, 500); // 500ms debounce

		return () => {
			if (fetchTimeoutRef.current) {
				clearTimeout(fetchTimeoutRef.current);
			}
		};
	}, [filters.dateFrom, filters.dateTo, filters.severity, filters.type, filters.acknowledged, sort.field, sort.direction, pagination.page, pagination.limit]);

	const acknowledgeAlert = async (alertId: string) => {
		await apiClient.put(`/api/alert-history/${alertId}/acknowledge`);
		// Refresh data after acknowledgment
		await fetchData();
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