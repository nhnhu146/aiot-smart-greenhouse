import React from 'react';
import { Line } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale,
} from 'chart.js';
import { ChartUtils } from '@/utils/chart/ChartUtils';
import 'chartjs-adapter-date-fns';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale
);

interface SensorData {
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
	plantHeight?: number;
	timestamp?: string;
	createdAt?: string;
}

interface LineChartVisualizationProps {
	data: SensorData[];
	loading: boolean;
	selectedMetrics: string[];
}

const LineChartVisualization: React.FC<LineChartVisualizationProps> = ({
	data,
	loading,
	selectedMetrics
}) => {
	const formatChartData = () => {
		if (!data || data.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		// Use ChartUtils to process and validate data with proper timestamp handling
		const dataWithNormalizedTimestamps = data.map(item => ({
			...item,
			timestamp: ChartUtils.normalizeTimestamp(item.createdAt || item.timestamp || new Date().toISOString())
		}));

		const validData = ChartUtils.filterValidData(dataWithNormalizedTimestamps);

		if (validData.length === 0) {
			console.warn('No valid data points after filtering');
			return {
				labels: [],
				datasets: []
			};
		}

		// Format data using ChartUtils with proper options
		return ChartUtils.formatForChart(validData, selectedMetrics);
	};

	// Chart options with improved tooltip formatting and date handling
	const getChartOptions = () => {
		const baseOptions = ChartUtils.getChartOptions();

		return {
			...baseOptions,
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				...baseOptions.plugins,
				tooltip: {
					callbacks: {
						title: (context: any) => {
							if (context[0]?.label) {
								try {
									const rawLabel = context[0].label;
									// Try to parse the date - handle various formats
									let date: Date;

									// If it's already a timestamp number
									if (!isNaN(Number(rawLabel))) {
										date = new Date(Number(rawLabel));
									} else {
										// Parse as string
										date = new Date(rawLabel);
									}

									// Check if date is valid
									if (isNaN(date.getTime())) {
										console.warn('Invalid date in tooltip:', rawLabel);
										return rawLabel; // Return original label if can't parse
									}

									// Format as DD/MM/YYYY HH:mm:ss
									return date.toLocaleString('vi-VN', {
										day: '2-digit',
										month: '2-digit',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
										second: '2-digit',
										hour12: false,
										timeZone: 'Asia/Ho_Chi_Minh'
									});
								} catch (error) {
									console.error('Error formatting tooltip date:', error);
									return 'Invalid Date';
								}
							}
							return '';
						},
						label: (context: any) => {
							const value = context.parsed.y;
							if (value === null || value === undefined) return '';

							const label = context.dataset.label || '';
							if (label.includes('Temperature')) return `${label}: ${value.toFixed(1)}°C`;
							if (label.includes('Humidity')) return `${label}: ${value.toFixed(1)}%`;
							if (label.includes('Soil') || label.includes('Water') || label.includes('Light')) {
								return `${label}: ${value === 1 ? 'Active' : 'Inactive'}`;
							}
							return `${label}: ${value.toFixed(1)}`;
						}
					}
				}
			},
			scales: {
				...baseOptions.scales,
				x: {
					...baseOptions.scales?.x,
					title: {
						display: true,
						text: 'Time (UTC+7)',
					},
					ticks: {
						callback: function (value: any) {
							try {
								// Use the value directly as it should be a timestamp
								const date = new Date(value);
								if (isNaN(date.getTime())) {
									return 'Invalid';
								}
								// Show only time for better readability
								return date.toLocaleString('en-GB', {
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
									hour12: false,
									timeZone: 'Asia/Ho_Chi_Minh'
								});
							} catch (error) {
								return 'Invalid';
							}
						}
					}
				}
			}
		};
	};

	// Simple loading state without animation
	if (loading && (!data || data.length === 0)) {
		return (
			<div className="chart-container" style={{ height: '400px', width: '100%' }}>
				<div className="d-flex justify-content-center align-items-center h-100">
					<div className="text-center">
						<div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📊</div>
						<p className="text-muted">Loading chart data...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="chart-empty">
				<div className="d-flex justify-content-center align-items-center flex-column" style={{ height: '400px' }}>
					<div className="text-muted mb-2" style={{ fontSize: '3rem' }}>📊</div>
					<h5 className="text-muted">No Data Available</h5>
					<p className="text-muted">Try selecting a different time range or check your connection.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="chart-container" style={{ height: '400px', width: '100%' }}>
			<Line data={formatChartData()} options={getChartOptions()} />
		</div>
	);
};

export default LineChartVisualization;
