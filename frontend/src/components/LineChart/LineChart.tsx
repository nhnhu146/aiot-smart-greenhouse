import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import mockDataService, { type ChartDataPoint } from '@/services/mockDataService';

// Register the components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Format time to English format
const formatTimeEN = (timestamp: string | Date) => {
	const date = new Date(timestamp);
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh'
	});
};

const AppLineChart: React.FC = () => {
	const { persistentSensorData, isConnected } = useWebSocketContext();
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Create chart data from persistent sensor state
	useEffect(() => {
		if (persistentSensorData && isConnected) {
			const { temperature, humidity, soil } = persistentSensorData;

			// Only create data point if we have at least one sensor value
			if (temperature || humidity || soil) {
				const currentTime = formatTimeEN(new Date());

				const newDataPoint: ChartDataPoint = {
					time: currentTime,
					temperature: temperature?.value || 0,
					humidity: humidity?.value || 0,
					soilMoisture: soil?.value || 0
				};

				setChartData(prev => {
					// Add new point and keep only last 24 points
					const updated = [...prev, newDataPoint];
					const latest24 = updated.slice(-24);

					// Sort by actual datetime to ensure chronological order (newest first for display)
					const sortedData = latest24.sort((a, b) => {
						// Parse the US time string back to Date for proper comparison
						const timeA = new Date(a.time).getTime();
						const timeB = new Date(b.time).getTime();

						return timeB - timeA;
					});

					console.log('📈 Chart updated with persistent sensor data:', newDataPoint);
					return sortedData;
				});

				setIsLoading(false);
			}
		}
	}, [persistentSensorData, isConnected]);

	// Initial data fetch as fallback
	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				const result = await mockDataService.getChartData();

				// Format timestamps to English format
				const formattedData = result.data.map(point => ({
					...point,
					time: formatTimeEN(point.time)
				}));

				// Only set if we don't have persistent data yet
				if (chartData.length === 0) {
					setChartData(formattedData);
					console.log(result.isMock ? '📊 Initial mock chart data loaded' : '📊 Initial API chart data loaded');
				}

				setIsLoading(false);
			} catch (error) {
				console.error('Failed to fetch initial chart data:', error);
				setIsLoading(false);
			}
		};

		if (isLoading) {
			fetchInitialData();
		}
	}, [isLoading, chartData.length]);

	if (isLoading) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '300px'
			}}>
				<div>Loading chart...</div>
			</div>
		);
	}

	// Check if chartData is empty to prevent accessing undefined properties
	if (chartData.length === 0) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '300px'
			}}>
				<div>No data available</div>
			</div>
		);
	}

	const data = {
		labels: [...chartData].reverse().map(point => {
			// Extract only time part for display on x-axis
			if (!point || !point.time) return 'Unknown';
			const timePart = point.time.split(', ')[1] || point.time.split(' ')[1] || point.time;
			return timePart;
		}),
		datasets: [
			{
				label: 'Temperature (°C)',
				data: [...chartData].reverse().map(point => point ? parseFloat((point.temperature || 0).toFixed(1)) : 0),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				tension: 0.1,
				fill: false,
			},
			{
				label: 'Humidity (%)',
				data: [...chartData].reverse().map(point => point ? parseFloat((point.humidity || 0).toFixed(1)) : 0),
				borderColor: 'rgb(54, 162, 235)',
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				tension: 0.1,
				fill: false,
			},
			{
				label: 'Soil Moisture (Binary)',
				data: [...chartData].reverse().map(point => point ? (point.soilMoisture || 0) : 0),
				borderColor: 'rgb(75, 192, 192)',
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				tension: 0.1,
				fill: false,
			}
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: false,
				text: 'Sensor Data Trends',
			},
			tooltip: {
				enabled: true,
				mode: 'index' as const,
				intersect: false,
			},
		},
		elements: {
			point: {
				radius: 3,
				hoverRadius: 6,
			},
		},
		scales: {
			y: {
				beginAtZero: false,
				// Dynamic scaling based on actual data
				suggestedMin: Math.min(...chartData.map(point =>
					Math.min(point.temperature || 0, point.humidity || 0)
				)) - 5,
				suggestedMax: Math.max(...chartData.map(point =>
					Math.max(point.temperature || 0, point.humidity || 0)
				)) + 5,
				ticks: {
					display: true,
					// Dynamic step size based on data range
					stepSize: Math.max(5, Math.round((Math.max(...chartData.map(point =>
						Math.max(point.temperature || 0, point.humidity || 0)
					)) - Math.min(...chartData.map(point =>
						Math.min(point.temperature || 0, point.humidity || 0)
					))) / 10)),
				},
				title: {
					display: true,
					text: 'Value',
				},
				grid: {
					display: true,
				},
			},
			x: {
				ticks: {
					display: true,
					maxTicksLimit: 12,
				},
				title: {
					display: true,
					text: 'Time',
				},
				grid: {
					display: true,
				},
			},
		},
		interaction: {
			mode: 'nearest' as const,
			axis: 'x' as const,
			intersect: false,
		},
	};

	return (
		<div style={{ width: '100%', minHeight: '450px', minWidth: '700px', overflow: 'auto' }}>
			<Line data={data} options={options} />
		</div>
	);
};

export default AppLineChart;
