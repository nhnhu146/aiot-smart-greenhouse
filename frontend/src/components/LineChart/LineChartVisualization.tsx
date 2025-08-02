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

		const labels = data.map(item => {
			const timestamp = item.createdAt || item.timestamp;
			return timestamp ? new Date(timestamp) : new Date();
		});

		const datasets = [];
		const colors = {
			temperature: '#ff6b6b',
			humidity: '#4dabf7',
			soilMoisture: '#69db7c',
			waterLevel: '#51cf66',
			lightLevel: '#ffd43b'
		};

		if (selectedMetrics.includes('temperature')) {
			datasets.push({
				label: 'Temperature (°C)',
				data: data.map(item => item.temperature || 0),
				borderColor: colors.temperature,
				backgroundColor: colors.temperature + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
			});
		}

		if (selectedMetrics.includes('humidity')) {
			datasets.push({
				label: 'Humidity (%)',
				data: data.map(item => item.humidity || 0),
				borderColor: colors.humidity,
				backgroundColor: colors.humidity + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
			});
		}

		if (selectedMetrics.includes('soilMoisture')) {
			datasets.push({
				label: 'Soil Moisture',
				data: data.map(item => item.soilMoisture || 0),
				borderColor: colors.soilMoisture,
				backgroundColor: colors.soilMoisture + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
			});
		}

		if (selectedMetrics.includes('waterLevel')) {
			datasets.push({
				label: 'Water Level',
				data: data.map(item => item.waterLevel || 0),
				borderColor: colors.waterLevel,
				backgroundColor: colors.waterLevel + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
			});
		}

		if (selectedMetrics.includes('lightLevel')) {
			datasets.push({
				label: 'Light Level',
				data: data.map(item => item.lightLevel || 0),
				borderColor: colors.lightLevel,
				backgroundColor: colors.lightLevel + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
			});
		}

		return { labels, datasets };
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			mode: 'index' as const,
			intersect: false,
		},
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: true,
				text: 'Sensor Data Timeline'
			},
			tooltip: {
				callbacks: {
					title: (context: any) => {
						return new Date(context[0].parsed.x).toLocaleString();
					}
				}
			}
		},
		scales: {
			x: {
				type: 'time' as const,
				time: {
					displayFormats: {
						hour: 'HH:mm',
						day: 'MMM dd',
						week: 'MMM dd',
						month: 'MMM yyyy'
					}
				},
				title: {
					display: true,
					text: 'Time'
				}
			},
			y: {
				beginAtZero: true,
				title: {
					display: true,
					text: 'Value'
				}
			}
		},
		elements: {
			point: {
				radius: 2,
				hoverRadius: 6
			}
		}
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
		<div className="chart-container" style={{ height: '400px' }}>
			<Line data={formatChartData()} options={options} />
		</div>
	);
};

export default LineChartVisualization;
