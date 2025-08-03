import { useState, useRef } from 'react';
import apiClient from '@/lib/apiClient';
import { FilterState } from '@/types/history';

export const useHistoryExport = () => {
	const [isExporting, setIsExporting] = useState(false);
	const exportInProgress = useRef(false); // Prevent multiple simultaneous exports

	const exportData = async (
		format: 'json' | 'csv',
		tab?: 'sensors' | 'controls' | 'voice',
		filters?: FilterState
	) => {
		// Prevent multiple simultaneous exports
		if (exportInProgress.current) {
			return;
		}

		exportInProgress.current = true;
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

			// Apply filters if provided - only add non-empty values
			if (filters) {
				Object.entries(filters).forEach(([key, value]) => {
					if (value && typeof value === 'string' && value.trim() !== '') {
						// Map filter keys to API parameter names
						const paramName = key === 'controlType' ? 'action' : key;
						params.append(paramName, value);
					}
				});
			}

			const response = await apiClient.get(`${endpoint}?${params.toString()}`);

			if (!response.data) {
				throw new Error('No data received from server');
			}

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
						const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			alert(`Export failed: ${errorMessage}`);
		} finally {
			// Always reset the exporting state, even if there was an error
			exportInProgress.current = false;
			// Use a small delay to prevent visual flicker
			setTimeout(() => {
				setIsExporting(false);
			}, 200);
		}
	};

	return {
		isExporting,
		exportData
	};
};
