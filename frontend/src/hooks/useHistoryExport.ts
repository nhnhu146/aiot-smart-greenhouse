import { useState } from 'react';
import apiClient from '@/lib/apiClient';

export const useHistoryExport = () => {
	const [isExporting, setIsExporting] = useState(false);

	const exportData = async (format: 'json' | 'csv', tab?: 'sensors' | 'controls' | 'voice') => {
		setIsExporting(true);
		try {
			let endpoint = '';
			let filename = '';

			switch (tab || 'all') {
				case 'sensors':
					endpoint = '/api/history/sensors/export';
					filename = `sensor-data-${new Date().toISOString().split('T')[0]}`;
					break;
				case 'controls':
					endpoint = '/api/history/devices/export';
					filename = `device-controls-${new Date().toISOString().split('T')[0]}`;
					break;
				case 'voice':
					endpoint = '/api/voice-commands/export';
					filename = `voice-commands-${new Date().toISOString().split('T')[0]}`;
					break;
				default:
					endpoint = '/api/history/export';
					filename = `all-data-${new Date().toISOString().split('T')[0]}`;
			}

			const response = await apiClient.get(`${endpoint}?format=${format}&sortBy=timestamp&sortOrder=desc&limit=1000`);

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
