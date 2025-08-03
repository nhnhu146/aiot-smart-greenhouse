import { useState, useEffect } from 'react';
import { FilterState, SortState, PaginationInfo } from '@/types/history';
import { useSensorHistory } from './history/useSensorHistory';
import { useDeviceHistory } from './history/useDeviceHistory';
import { useVoiceHistory } from './history/useVoiceHistory';

interface VoiceCommand {
	_id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

interface UseHistoryDataReturn {
	sensorData: any[];
	deviceControls: any[];
	voiceCommands: VoiceCommand[];
	sensorPagination: PaginationInfo;
	devicePagination: PaginationInfo;
	voicePagination: PaginationInfo;
	loading: {
		sensors: boolean;
		controls: boolean;
		voice: boolean;
	};
	handlePageChange: (tab: 'sensors' | 'controls' | 'voice', page: number) => void;
	refreshData: (tab?: 'sensors' | 'controls' | 'voice') => void;
}

export const useHistoryData = (
	filters: FilterState,
	sensorSort: SortState,
	deviceSort: SortState,
	voiceSort: SortState
): UseHistoryDataReturn => {
	const [sensorPagination, setSensorPagination] = useState<PaginationInfo>({
		page: 1,
		limit: parseInt(filters.pageSize) || 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	const [devicePagination, setDevicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: parseInt(filters.pageSize) || 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	const [voicePagination, setVoicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: parseInt(filters.pageSize) || 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	const sensorHistory = useSensorHistory(filters, sensorSort, sensorPagination, setSensorPagination);
	const deviceHistory = useDeviceHistory(filters, deviceSort, devicePagination, setDevicePagination);
	const voiceHistory = useVoiceHistory(filters, voiceSort, voicePagination, setVoicePagination);

	// Client-side sorting to prevent re-fetching
	const sortData = (data: any[], sortState: SortState) => {
		if (!data || data.length === 0) return data;

		return [...data].sort((a, b) => {
			let aVal = a[sortState.field];
			let bVal = b[sortState.field];

			// Handle date fields
			if (sortState.field === 'timestamp' || sortState.field === 'createdAt') {
				aVal = new Date(aVal).getTime();
				bVal = new Date(bVal).getTime();
			}

			// Handle numeric fields
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
			}

			// Handle string fields
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return sortState.direction === 'asc'
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			return 0;
		});
	};

	const handlePageChange = (tab: 'sensors' | 'controls' | 'voice', page: number) => {
		switch (tab) {
			case 'sensors':
				setSensorPagination(prev => ({ ...prev, page }));
				break;
			case 'controls':
				setDevicePagination(prev => ({ ...prev, page }));
				break;
			case 'voice':
				setVoicePagination(prev => ({ ...prev, page }));
				break;
		}
	};

	const refreshData = (tab?: 'sensors' | 'controls' | 'voice') => {
		if (!tab || tab === 'sensors') sensorHistory.refreshData();
		if (!tab || tab === 'controls') deviceHistory.refreshData();
		if (!tab || tab === 'voice') voiceHistory.refreshData();
	};

	// Effect to update page size when filters change
	useEffect(() => {
		const newLimit = parseInt(filters.pageSize) || 20;
		setSensorPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
		setDevicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
		setVoicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
	}, [filters.pageSize]);

	return {
		sensorData: sortData(sensorHistory.data, sensorSort),
		deviceControls: sortData(deviceHistory.data, deviceSort),
		voiceCommands: sortData(voiceHistory.data, voiceSort),
		sensorPagination,
		devicePagination,
		voicePagination,
		loading: {
			sensors: sensorHistory.loading,
			controls: deviceHistory.loading,
			voice: voiceHistory.loading
		},
		handlePageChange,
		refreshData
	};
};
