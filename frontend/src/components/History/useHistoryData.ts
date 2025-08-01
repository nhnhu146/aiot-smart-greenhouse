import { useState, useCallback } from 'react';
import mockDataService, { type ChartDataPoint, type DeviceControl } from '@/services/mockDataService';
import { FilterState, PaginationInfo } from '@/types/history';

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

interface DataCounts {
	sensors: number;
	devices: number;
	voice: number;
}

interface UseHistoryDataReturn {
	// Data states
	data: ChartDataPoint[];
	deviceControls: DeviceControl[];
	voiceCommands: VoiceCommand[];
	dataCounts: DataCounts;
	isUsingMockData: boolean;
	isLoading: boolean;
	isExporting: boolean;

	// Pagination states
	sensorPagination: PaginationInfo;
	devicePagination: PaginationInfo;
	voicePagination: PaginationInfo;

	// Actions
	fetchSensorData: (page?: number) => Promise<void>;
	fetchDeviceControls: (page?: number) => Promise<void>;
	fetchVoiceCommands: (page?: number) => Promise<void>;
	fetchDataCounts: () => Promise<void>;
	exportToCSV: (activeTab: string, filters: FilterState) => Promise<void>;
	setSensorPagination: React.Dispatch<React.SetStateAction<PaginationInfo>>;
	setDevicePagination: React.Dispatch<React.SetStateAction<PaginationInfo>>;
	setVoicePagination: React.Dispatch<React.SetStateAction<PaginationInfo>>;
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useHistoryData = (
	filters: FilterState,
	sensorSort: { field: string; direction: string },
	deviceSort: { field: string; direction: string },
	voiceSort: { field: string; direction: string }
): UseHistoryDataReturn => {
	// Data states
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [deviceControls, setDeviceControls] = useState<DeviceControl[]>([]);
	const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
	const [dataCounts, setDataCounts] = useState<DataCounts>({ sensors: 0, devices: 0, voice: 0 });
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);

	// Pagination states
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

	// Helper function to build query params
	const buildQueryParams = (pagination: PaginationInfo, filters: FilterState, sortField?: string, sortDirection?: string) => {
		const params = new URLSearchParams();
		params.append('page', pagination.page.toString());
		params.append('limit', pagination.limit.toString());

		// Add sorting parameters
		if (sortField) params.append('sortField', sortField);
		if (sortDirection) params.append('sortDirection', sortDirection);

		if (filters.dateFrom) params.append('from', filters.dateFrom);
		if (filters.dateTo) params.append('to', filters.dateTo);
		if (filters.minTemperature) params.append('minTemperature', filters.minTemperature);
		if (filters.maxTemperature) params.append('maxTemperature', filters.maxTemperature);
		if (filters.minHumidity) params.append('minHumidity', filters.minHumidity);
		if (filters.maxHumidity) params.append('maxHumidity', filters.maxHumidity);
		if (filters.minSoilMoisture) params.append('minSoilMoisture', filters.minSoilMoisture);
		if (filters.maxSoilMoisture) params.append('maxSoilMoisture', filters.maxSoilMoisture);
		if (filters.minWaterLevel) params.append('minWaterLevel', filters.minWaterLevel);
		if (filters.maxWaterLevel) params.append('maxWaterLevel', filters.maxWaterLevel);
		if (filters.soilMoisture) params.append('soilMoisture', filters.soilMoisture);
		if (filters.waterLevel) params.append('waterLevel', filters.waterLevel);
		if (filters.rainStatus) params.append('rainStatus', filters.rainStatus);
		if (filters.deviceType) params.append('deviceType', filters.deviceType);
		if (filters.controlType) params.append('controlType', filters.controlType);

		return params.toString();
	};

	// Fetch data counts for navigation tabs
	const fetchDataCounts = useCallback(async () => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

			const [sensorsRes, devicesRes, voiceRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/sensors/count`),
				fetch(`${API_BASE_URL}/api/history/device-controls/count`),
				fetch(`${API_BASE_URL}/api/voice-commands/count`)
			]);

			const sensorsData = await sensorsRes.json();
			const devicesData = await devicesRes.json();
			const voiceData = await voiceRes.json();

			setDataCounts({
				sensors: sensorsData.count || 0,
				devices: devicesData.count || 0,
				voice: voiceData.count || 0
			});
		} catch (error) {
			console.error('Failed to fetch data counts:', error);
		}
	}, []);

	// Fetch sensor data from backend API
	const fetchSensorData = useCallback(async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...sensorPagination, page }, filters, sensorSort.field, sensorSort.direction);
			const response = await fetch(`${API_BASE_URL}/api/sensors?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch sensor data");
			}

			const result = await response.json();
			if (result.success) {
				// Transform API response to match our interface
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

				setData(transformedData);
				setSensorPagination(result.data.pagination);
			} else {
				console.error("API returned error:", result.message);
				throw new Error(result.message);
			}
		} catch (error) {
			console.error("Failed to fetch sensor data:", error);
			// Fallback to mock data
			const mockResult = await mockDataService.getChartData();
			setData(mockResult.data);
			setIsUsingMockData(true);
		}
	}, [filters, sensorSort.field, sensorSort.direction, sensorPagination]);

	// Fetch device control history
	const fetchDeviceControls = useCallback(async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...devicePagination, page }, filters, deviceSort.field, deviceSort.direction);
			const response = await fetch(`${API_BASE_URL}/api/history/device-controls?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch device controls");
			}

			const result = await response.json();
			if (result.success) {
				setDeviceControls(result.data.controls || []);
				setDevicePagination(result.data.pagination);
			}
		} catch (error) {
			console.error("Failed to fetch device controls:", error);
		}
	}, [filters, deviceSort.field, deviceSort.direction, devicePagination]);

	// Fetch voice commands history
	const fetchVoiceCommands = useCallback(async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...voicePagination, page }, filters, voiceSort.field, voiceSort.direction);
			const response = await fetch(`${API_BASE_URL}/api/voice-commands?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch voice commands");
			}

			const result = await response.json();
			if (result.success) {
				setVoiceCommands(result.data.commands || []);
				setVoicePagination(result.data.pagination);
			}
		} catch (error) {
			console.error("Failed to fetch voice commands:", error);
			setVoiceCommands([]);
		}
	}, [filters, voiceSort.field, voiceSort.direction, voicePagination]);

	// Export to CSV with filters
	const exportToCSV = useCallback(async (activeTab: string, filters: FilterState) => {
		setIsExporting(true);
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			let exportUrl = "";
			let filename = "";

			switch (activeTab) {
				case "sensors":
					exportUrl = `/api/history/export/sensors`;
					filename = "sensor-data.csv";
					break;
				case "controls":
					exportUrl = `/api/history/export/device-controls`;
					filename = "device-controls.csv";
					break;
				case "voice":
					exportUrl = `/api/history/export/voice-commands`;
					filename = "voice-commands.csv";
					break;
			}

			// Build query params for export (without pagination)
			const queryParams = buildQueryParams({ page: 1, limit: 999999, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters);
			const response = await fetch(`${API_BASE_URL}${exportUrl}?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to export data");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error("Failed to export data:", error);
			alert("Failed to export data. Please try again.");
		} finally {
			setIsExporting(false);
		}
	}, []);

	return {
		// Data states
		data,
		deviceControls,
		voiceCommands,
		dataCounts,
		isUsingMockData,
		isLoading,
		isExporting,

		// Pagination states
		sensorPagination,
		devicePagination,
		voicePagination,

		// Actions
		fetchSensorData,
		fetchDeviceControls,
		fetchVoiceCommands,
		fetchDataCounts,
		exportToCSV,
		setSensorPagination,
		setDevicePagination,
		setVoicePagination,
		setIsLoading,
	};
};
