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

	// Load data from localStorage on mount
	useEffect(() => {
		const savedData = localStorage.getItem('chartData');
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData);
				setChartData(parsedData);
				setIsLoading(false);
			} catch (error) {
				console.error('Error loading chart data from localStorage:', error);
			}
		}
	}, []);

	// Save data to localStorage whenever chartData changes
	useEffect(() => {
		if (chartData.length > 0) {
			localStorage.setItem('chartData', JSON.stringify(chartData));
		}
	}, [chartData]);

	// Fetch initial data from API if localStorage is empty
	useEffect(() => {
		const fetchInitialData = async () => {
			if (chartData.length > 0) return; // Skip if we already have data

			try {
				const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
				const response = await fetch(`${API_BASE_URL}/api/sensors?limit=100`);

				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data && result.data.sensors) {
						const formattedData = result.data.sensors.map((sensor: any) => ({
							time: formatTimeEN(sensor.time || sensor.timestamp),
							temperature: parseFloat(sensor.temperature) || 0,
							humidity: parseFloat(sensor.humidity) || 0,
							soilMoisture: parseInt(sensor.soilMoisture) || 0,
						}));

						// Sort by timestamp descending (newest first for display)
						const sortedData = formattedData.sort((a: ChartDataPoint, b: ChartDataPoint) => {
							const timeA = new Date(a.time).getTime();
							const timeB = new Date(b.time).getTime();
							return timeB - timeA;
						}).slice(0, 24); // Keep only last 24 points

						setChartData(sortedData);
					}
				} else {
					// Fallback to mock data if API fails
					const result = await mockDataService.getChartData();
					const formattedData = result.data.map(point => ({
						...point,
						time: formatTimeEN(point.time)
					}));
					setChartData(formattedData);
				}
			} catch (error) {
				console.error('Failed to fetch initial chart data:', error);
				// Fallback to mock data on error
				try {
					const result = await mockDataService.getChartData();
					const formattedData = result.data.map(point => ({
						...point,
						time: formatTimeEN(point.time)
					}));
					setChartData(formattedData);
				} catch (mockError) {
					console.error('Failed to fetch mock data:', mockError);
				}
			} finally {
				setIsLoading(false);
			}
		};

		if (isLoading && chartData.length === 0) {
			fetchInitialData();
		}
	}, [isLoading, chartData.length]);

	// Listen to WebSocket signals and update chart data
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

					return sortedData;
				});

				setIsLoading(false);
			}
		}
	}, [persistentSensorData, isConnected]);

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
