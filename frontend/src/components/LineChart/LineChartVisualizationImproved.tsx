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

const LineChartVisualizationImproved: React.FC<LineChartVisualizationProps> = ({
	data,
	loading,
	selectedMetrics
}) => {
	// Filter data to only include entries with valid timestamps
	const filterValidData = (rawData: SensorData[]) => {
		return rawData.filter(item => {
			const timestamp = item.createdAt || item.timestamp;
			return timestamp && !isNaN(new Date(timestamp).getTime());
		});
	};

	const formatChartData = () => {
		const validData = filterValidData(data);

		if (!validData || validData.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		// Create labels from valid timestamps only
		const labels = validData.map(item => {
			const timestamp = item.createdAt || item.timestamp;
			return new Date(timestamp!);
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
				data: validData.map(item => item.temperature ?? null),
				borderColor: colors.temperature,
				backgroundColor: colors.temperature + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
				spanGaps: true,
			});
		}

		if (selectedMetrics.includes('humidity')) {
			datasets.push({
				label: 'Humidity (%)',
				data: validData.map(item => item.humidity ?? null),
				borderColor: colors.humidity,
				backgroundColor: colors.humidity + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
				spanGaps: true,
			});
		}

		if (selectedMetrics.includes('soilMoisture')) {
			datasets.push({
				label: 'Soil Moisture',
				data: validData.map(item => item.soilMoisture ?? null),
				borderColor: colors.soilMoisture,
				backgroundColor: colors.soilMoisture + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
				spanGaps: true,
			});
		}

		if (selectedMetrics.includes('waterLevel')) {
			datasets.push({
				label: 'Water Level',
				data: validData.map(item => item.waterLevel ?? null),
				borderColor: colors.waterLevel,
				backgroundColor: colors.waterLevel + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
				spanGaps: true,
			});
		}

		if (selectedMetrics.includes('lightLevel')) {
			datasets.push({
				label: 'Light Level',
				data: validData.map(item => item.lightLevel ?? null),
				borderColor: colors.lightLevel,
				backgroundColor: colors.lightLevel + '20',
				fill: false,
				tension: 0.1,
				pointRadius: 2,
				pointHoverRadius: 4,
				spanGaps: true,
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
			title: {
				display: false,
			},
			legend: {
				position: 'top' as const,
			},
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
						if (label.includes('Soil') || label.includes('Water')) {
							return `${label}: ${value === 1 ? 'Yes' : 'No'}`;
						}
						return `${label}: ${value.toFixed(1)}`;
					}
				}
			}
		},
		scales: {
			x: {
				type: 'time' as const,
				time: {
					displayFormats: {
						minute: 'HH:mm',
						hour: 'MMM dd, HH:mm',
						day: 'MMM dd',
					},
				},
				title: {
					display: true,
					text: 'Time (UTC+7)',
				},
			},
			y: {
				beginAtZero: false,
				title: {
					display: true,
					text: 'Value',
				},
			},
		},
	};

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading chart data...</span>
				</div>
			</div>
		);
	}

	const chartData = formatChartData();

	if (chartData.labels.length === 0) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
				<div className="text-center">
					<h5>No Valid Data Available</h5>
					<p className="text-muted">Please check your time range or wait for new sensor data with valid timestamps.</p>
				</div>
			</div>
		);
	}

	return (
		<div style={{ height: '400px', width: '100%' }}>
			<Line data={chartData} options={options} />
		</div>
	);
};

export default LineChartVisualizationImproved;
