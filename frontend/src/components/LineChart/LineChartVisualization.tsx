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

		// Use ChartUtils to clean and validate data with enhanced timestamp handling
		const validData = ChartUtils.filterValidData(data.map(item => ({
			...item,
			timestamp: item.createdAt || item.timestamp || new Date().toISOString()
		})));

		if (validData.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		// Format data using ChartUtils with enhanced options
		return ChartUtils.formatForChart(validData, selectedMetrics);
	};

	// Enhanced chart options with better tooltip formatting
	const getEnhancedOptions = () => {
		const baseOptions = ChartUtils.getChartOptions();
		
		return {
			...baseOptions,
			plugins: {
				...baseOptions.plugins,
				tooltip: {
					callbacks: {
						title: (context: any) => {
							if (context[0]?.label) {
								const date = new Date(context[0].label);
								return date.toLocaleString('en-US', {
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									timeZone: 'Asia/Ho_Chi_Minh'
								});
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
								return `${label}: ${value === 1 ? 'Yes' : 'No'}`;
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
				}
			}
		};
	};

	if (loading) {
		return (
			<div className="chart-loading">
				<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
					<div className="spinner-border text-primary me-2" role="status">
						<span className="sr-only">Loading chart...</span>
					</div>
					<span>Loading chart data...</span>
				</div>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="chart-empty">
				<div className="d-flex justify-content-center align-items-center flex-column" style={{ height: '300px' }}>
					<div className="text-muted mb-2" style={{ fontSize: '3rem' }}>📊</div>
					<h5 className="text-muted">No Data Available</h5>
					<p className="text-muted">Try selecting a different time range or check your connection.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="chart-container" style={{ minHeight: '450px', width: '100%' }}>
			<Line data={formatChartData()} options={getEnhancedOptions()} />
		</div>
	);
};

export default LineChartVisualization;
