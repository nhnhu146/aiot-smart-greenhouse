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
		if (!tab || tab === 'sensors') sensorHistory.refresh();
		if (!tab || tab === 'controls') deviceHistory.refresh();
		if (!tab || tab === 'voice') voiceHistory.refresh();
	};

	// Effect to update page size when filters change
	useEffect(() => {
		const newLimit = parseInt(filters.pageSize) || 20;
		setSensorPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
		setDevicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
		setVoicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
	}, [filters.pageSize]);

	return {
		sensorData: sensorHistory.data,
		deviceControls: deviceHistory.data,
		voiceCommands: voiceHistory.data,
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
