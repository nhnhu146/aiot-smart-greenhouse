import { useState, useEffect } from 'react';
import { FilterState, PaginationInfo, SortState } from '@/types/history';

interface DataCounts {
	sensors: number;
	devices: number;
	voice: number;
}

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

interface UseHistoryDataReturn {
	// Data
	sensorData: any[];
	deviceControls: any[];
	voiceCommands: VoiceCommand[];
	dataCounts: DataCounts;

	// Loading states
	isLoading: boolean;
	isExporting: boolean;

	// Pagination
	sensorPagination: PaginationInfo;
	devicePagination: PaginationInfo;
	voicePagination: PaginationInfo;

	// Actions
	fetchSensorData: (page?: number) => Promise<void>;
	fetchDeviceData: (page?: number) => Promise<void>;
	fetchVoiceData: (page?: number) => Promise<void>;
	fetchDataCounts: () => Promise<void>;
	exportData: (format: 'json' | 'csv') => Promise<void>;
	setSensorPagination: (pagination: PaginationInfo) => void;
	setDevicePagination: (pagination: PaginationInfo) => void;
	setVoicePagination: (pagination: PaginationInfo) => void;
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
	const [dataCounts, setDataCounts] = useState<DataCounts>({ sensors: 0, devices: 0, voice: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);

	const [sensorPagination, setSensorPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	const [devicePagination, setDevicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	const [voicePagination, setVoicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

	const buildQueryParams = (pagination: PaginationInfo, currentFilters: FilterState, sortField: string, sortDirection: string): string => {
		const params = new URLSearchParams();

		// Pagination
		params.append('page', pagination.page.toString());
		params.append('limit', pagination.limit.toString());

		// Sorting
		if (sortField && sortDirection) {
			params.append('sortBy', sortField);
			params.append('sortOrder', sortDirection);
		}

		// Filters
		Object.entries(currentFilters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				params.append(key, value.toString());
			}
		});

		return params.toString();
	};

	const fetchDataCounts = async () => {
		try {
			const [sensorsRes, devicesRes, voiceRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/sensors/count`),
				fetch(`${API_BASE_URL}/api/history/device-controls/count`),
				fetch(`${API_BASE_URL}/api/voice-commands/count`)
			]);

			const sensorsData = await sensorsRes.json();
			const devicesData = await devicesRes.json();
			const voiceData = await voiceRes.json();

			setDataCounts({
				sensors: sensorsData.data?.count || 0,
				devices: devicesData.data?.count || 0,
				voice: voiceData.data?.count || 0
			});
		} catch (error) {
			console.error('Failed to fetch data counts:', error);
		}
	};

	const fetchSensorData = async (page: number = 1) => {
		try {
			setIsLoading(true);
			const queryParams = buildQueryParams(
				{ ...sensorPagination, page },
				filters,
				sensorSort.field,
				sensorSort.direction
			);
			const response = await fetch(`${API_BASE_URL}/api/sensors?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch sensor data");
			}

			const result = await response.json();
			if (result.success) {
				const transformedData = result.data.sensors?.map((item: any) => ({
					time: item.createdAt || item.timestamp,
					temperature: item.temperature || 0,
					humidity: item.humidity || 0,
					soilMoisture: item.soilMoisture || 0,
					waterLevel: item.waterLevel || 0,
					plantHeight: item.plantHeight || 0,
					rainStatus: item.rainStatus || false,
					lightLevel: item.lightLevel || 0,
				})) || [];

				setSensorData(transformedData);
				setSensorPagination({
					page: result.data.pagination.page,
					limit: result.data.pagination.limit,
					total: result.data.pagination.total,
					totalPages: result.data.pagination.totalPages,
					hasNext: result.data.pagination.hasNext,
					hasPrev: result.data.pagination.hasPrev
				});
			}
		} catch (error) {
			console.error('Error fetching sensor data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDeviceData = async (page: number = 1) => {
		try {
			setIsLoading(true);
			const queryParams = buildQueryParams(
				{ ...devicePagination, page },
				filters,
				deviceSort.field,
				deviceSort.direction
			);
			const response = await fetch(`${API_BASE_URL}/api/history/device-controls?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch device control data");
			}

			const result = await response.json();
			if (result.success) {
				setDeviceControls(result.data.deviceControls || []);
				setDevicePagination({
					page: result.data.pagination.page,
					limit: result.data.pagination.limit,
					total: result.data.pagination.total,
					totalPages: result.data.pagination.totalPages,
					hasNext: result.data.pagination.hasNext,
					hasPrev: result.data.pagination.hasPrev
				});
			}
		} catch (error) {
			console.error('Error fetching device control data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchVoiceData = async (page: number = 1) => {
		try {
			setIsLoading(true);
			const queryParams = buildQueryParams(
				{ ...voicePagination, page },
				filters,
				voiceSort.field,
				voiceSort.direction
			);
			const response = await fetch(`${API_BASE_URL}/api/voice-commands?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch voice command data");
			}

			const result = await response.json();
			if (result.success) {
				const transformedCommands = result.data.commands?.map((item: any) => ({
					id: item._id,
					command: item.command,
					confidence: item.confidence,
					timestamp: item.timestamp || item.createdAt,
					processed: item.processed,
					errorMessage: item.errorMessage,
				})) || [];

				setVoiceCommands(transformedCommands);
				setVoicePagination({
					page: result.data.pagination.page,
					limit: result.data.pagination.limit,
					total: result.data.pagination.total,
					totalPages: result.data.pagination.totalPages,
					hasNext: result.data.pagination.hasNext,
					hasPrev: result.data.pagination.hasPrev
				});
			}
		} catch (error) {
			console.error('Error fetching voice command data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const exportData = async (format: 'json' | 'csv') => {
		try {
			setIsExporting(true);
			const queryParams = buildQueryParams(
				{ page: 1, limit: 10000, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
				filters,
				'',
				''
			);
			const response = await fetch(`${API_BASE_URL}/api/history/export?format=${format}&${queryParams}`);

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				let filename = `history-export-${Date.now()}`;

				if (contentType?.includes('text/csv')) {
					filename += '.csv';
					const blob = await response.blob();
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				} else {
					filename += '.json';
					const data = await response.json();
					const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				}
			}
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			setIsExporting(false);
		}
	};

	// Auto-fetch data on filter/sort changes
	useEffect(() => {
		fetchDataCounts();
	}, []);

	useEffect(() => {
		fetchSensorData();
	}, [filters, sensorSort]);

	useEffect(() => {
		fetchDeviceData();
	}, [filters, deviceSort]);

	useEffect(() => {
		fetchVoiceData();
	}, [filters, voiceSort]);

	return {
		// Data
		sensorData,
		deviceControls,
		voiceCommands,
		dataCounts,

		// Loading states
		isLoading,
		isExporting,

		// Pagination
		sensorPagination,
		devicePagination,
		voicePagination,

		// Actions
		fetchSensorData,
		fetchDeviceData,
		fetchVoiceData,
		fetchDataCounts,
		exportData,
		setSensorPagination,
		setDevicePagination,
		setVoicePagination,
	};
};
