import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { FilterState } from '@/types/history';

export const useHistoryExport = () => {
	const [isExporting, setIsExporting] = useState(false);

	const exportData = async (
		format: 'json' | 'csv',
		tab?: 'sensors' | 'controls' | 'voice',
		filters?: FilterState
	) => {
		setIsExporting(true);
		try {
			let endpoint = '';
			let filename = '';

			switch (tab || 'all') {
				case 'sensors':
					endpoint = '/api/history/export/sensors';
					filename = `sensor-data-${new Date().toISOString().split('T')[0]}`;
					break;
				case 'controls':
					endpoint = '/api/history/export/device-controls';
					filename = `device-controls-${new Date().toISOString().split('T')[0]}`;
					break;
				case 'voice':
					endpoint = '/api/history/export/voice-commands';
					filename = `voice-commands-${new Date().toISOString().split('T')[0]}`;
					break;
				default:
					endpoint = '/api/history/export';
					filename = `all-data-${new Date().toISOString().split('T')[0]}`;
			}

			// Build query parameters with filters
			const params = new URLSearchParams();
			params.append('format', format);
			params.append('sortBy', 'createdAt');
			params.append('sortOrder', 'desc');
			params.append('limit', '10000'); // Higher limit for export

			// Apply filters if provided
			if (filters) {
				if (filters.dateFrom && filters.dateFrom.trim()) params.append('dateFrom', filters.dateFrom);
				if (filters.dateTo && filters.dateTo.trim()) params.append('dateTo', filters.dateTo);
				if (filters.minTemperature && filters.minTemperature.trim()) params.append('minTemperature', filters.minTemperature);
				if (filters.maxTemperature && filters.maxTemperature.trim()) params.append('maxTemperature', filters.maxTemperature);
				if (filters.minHumidity && filters.minHumidity.trim()) params.append('minHumidity', filters.minHumidity);
				if (filters.maxHumidity && filters.maxHumidity.trim()) params.append('maxHumidity', filters.maxHumidity);
				if (filters.soilMoisture && filters.soilMoisture.trim()) params.append('soilMoisture', filters.soilMoisture);
				if (filters.waterLevel && filters.waterLevel.trim()) params.append('waterLevel', filters.waterLevel);
				if (filters.rainStatus && filters.rainStatus.trim()) params.append('rainStatus', filters.rainStatus);
				if (filters.deviceType && filters.deviceType.trim()) params.append('deviceType', filters.deviceType);
				if (filters.controlType && filters.controlType.trim()) params.append('action', filters.controlType);
			}

			const response = await apiClient.get(`${endpoint}?${params.toString()}`);

			// Create and download file
			const blob = new Blob([
				format === 'json' ? JSON.stringify(response.data, null, 2) : response.data
			], {
				type: format === 'json' ? 'application/json' : 'text/csv'
			});

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${filename}.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

		} catch (error) {
			console.error('Export failed:', error);
			alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsExporting(false);
		}
	};

	return {
		isExporting,
		exportData
	};
};
