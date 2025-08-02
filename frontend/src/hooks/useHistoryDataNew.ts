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
	const [sensorData, setSensorData] = useState<any[]>([]);
	const [deviceControls, setDeviceControls] = useState<any[]>([]);
	const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);

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

	const [loading, setLoading] = useState({
		sensors: false,
		controls: false,
		voice: false
	});

	const buildSensorParams = () => {
		const params: any = {
			page: sensorPagination.page,
			limit: sensorPagination.limit,
			sortBy: sensorSort.field,
			sortOrder: sensorSort.direction
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

	const buildDeviceParams = () => {
		const params: any = {
			page: devicePagination.page,
			limit: devicePagination.limit,
			sortBy: deviceSort.field,
			sortOrder: deviceSort.direction
		};

		if (filters.dateFrom) params.dateFrom = filters.dateFrom;
		if (filters.dateTo) params.dateTo = filters.dateTo;
		if (filters.deviceType) params.deviceType = filters.deviceType;
		if (filters.controlType) params.action = filters.controlType;

		return params;
	};

	const buildVoiceParams = () => {
		const params: any = {
			page: voicePagination.page,
			limit: voicePagination.limit,
			sortBy: voiceSort.field,
			sortOrder: voiceSort.direction
		};

		if (filters.dateFrom) params.dateFrom = filters.dateFrom;
		if (filters.dateTo) params.dateTo = filters.dateTo;

		return params;
	};

	const fetchSensorData = async () => {
		setLoading(prev => ({ ...prev, sensors: true }));
		try {
			const params = buildSensorParams();
			const response = await apiClient.get('/api/history/sensors', { params });
			setSensorData(response.data.data || []);
			setSensorPagination(response.data.pagination || sensorPagination);
		} catch (error) {
			console.error('Error fetching sensor data:', error);
			setSensorData([]);
		} finally {
			setLoading(prev => ({ ...prev, sensors: false }));
		}
	};

	const fetchDeviceControls = async () => {
		setLoading(prev => ({ ...prev, controls: true }));
		try {
			const params = buildDeviceParams();
			const response = await apiClient.get('/api/history/devices', { params });
			setDeviceControls(response.data.data || []);
			setDevicePagination(response.data.pagination || devicePagination);
		} catch (error) {
			console.error('Error fetching device controls:', error);
			setDeviceControls([]);
		} finally {
			setLoading(prev => ({ ...prev, controls: false }));
		}
	};

	const fetchVoiceCommands = async () => {
		setLoading(prev => ({ ...prev, voice: true }));
		try {
			const params = buildVoiceParams();
			const response = await apiClient.get('/api/voice-commands', { params });
			setVoiceCommands(response.data.data || []);
			setVoicePagination(response.data.pagination || voicePagination);
		} catch (error) {
			console.error('Error fetching voice commands:', error);
			setVoiceCommands([]);
		} finally {
			setLoading(prev => ({ ...prev, voice: false }));
		}
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
		if (!tab || tab === 'sensors') fetchSensorData();
		if (!tab || tab === 'controls') fetchDeviceControls();
		if (!tab || tab === 'voice') fetchVoiceCommands();
	};

	// Effect to update page size when filters change
	useEffect(() => {
		const newLimit = parseInt(filters.pageSize) || 20;
		setSensorPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
		setDevicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
		setVoicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
	}, [filters.pageSize]);

	// Effect to fetch sensor data when dependencies change
	useEffect(() => {
		fetchSensorData();
	}, [filters, sensorSort, sensorPagination.page, sensorPagination.limit]);

	// Effect to fetch device data when dependencies change
	useEffect(() => {
		fetchDeviceControls();
	}, [filters, deviceSort, devicePagination.page, devicePagination.limit]);

	// Effect to fetch voice data when dependencies change
	useEffect(() => {
		fetchVoiceCommands();
	}, [filters, voiceSort, voicePagination.page, voicePagination.limit]);

	return {
		sensorData,
		deviceControls,
		voiceCommands,
		sensorPagination,
		devicePagination,
		voicePagination,
		loading,
		handlePageChange,
		refreshData
	};
};
