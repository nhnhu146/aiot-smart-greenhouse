import { useRef } from 'react';
import apiClient from '@/lib/apiClient';
import { FilterState } from '@/types/history';

export const useHistoryExport = () => {
	// Removed isExporting state to eliminate loading effects
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
						const paramName = key === 'deviceType' ? 'device' : key;
						params.append(paramName, value);
					}
				});
			}

			// Use apiClient.get to properly handle authentication and API format
			const response = await apiClient.get(`${endpoint}?${params.toString()}`);

			// Handle response based on format
			if (format === 'csv') {
				// For CSV, the response should be the CSV content directly
				const csvData = typeof response === 'string' ? response :
					(response.data && typeof response.data === 'string') ? response.data :
						(response.success && response.data) ? JSON.stringify(response.data, null, 2) :
							JSON.stringify(response, null, 2);

				const blob = new Blob([csvData], { type: 'text/csv; charset=utf-8' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${filename}.csv`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			} else {
				// For JSON, handle the structured response
				const jsonData = response.success && response.data ? response.data : response;
				const dataStr = JSON.stringify(jsonData, null, 2);

				const blob = new Blob([dataStr], { type: 'application/json; charset=utf-8' });
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${filename}.json`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error('Export failed:', error);
			// Simple error handling without UI effects - could add toast notification here
		} finally {
			// Always reset the exporting state
			exportInProgress.current = false;
		}
	};

	return {
		isExporting: false, // Always false to eliminate loading effects
		exportData
	};
};
