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

		// Use ChartUtils to process and validate data with proper timestamp handling
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

		// Format data using ChartUtils with proper options
		return ChartUtils.formatForChart(validData, selectedMetrics);
	};

	// Chart options with improved tooltip formatting
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
								const date = new Date(context[0].label);
								// Format as HH:mm:ss for better readability
								return date.toLocaleString('en-US', {
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
									hour12: false,
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
						text: 'Time (HH:mm:ss)',
					},
				}
			}
		};
	};

	// Skeleton loading for better UX
	if (loading && (!data || data.length === 0)) {
		return (
			<div className="chart-container" style={{ height: '400px', width: '100%' }}>
				<div className="chart-skeleton">
					<div className="skeleton-bars">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="skeleton-bar"
								style={{
									height: `${Math.random() * 200 + 50}px`,
									animationDelay: `${i * 0.1}s`
								}}
							/>
						))}
					</div>
					<div className="skeleton-loading-text">
						<span>📊 Loading chart data...</span>
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
