import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { type ChartDataPoint } from '@/services/mockDataService';

// Register the components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// LocalStorage key for chart data
const CHART_DATA_KEY = 'greenhouse_chart_data';
const MAX_CHART_POINTS = 50; // Limit data points for performance

// Save data to localStorage
const saveChartDataToStorage = (data: ChartDataPoint[]) => {
	try {
		localStorage.setItem(CHART_DATA_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Failed to save chart data to localStorage:', error);
	}
};

// Load data from localStorage
const loadChartDataFromStorage = (): ChartDataPoint[] => {
	try {
		const stored = localStorage.getItem(CHART_DATA_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		console.error('Failed to load chart data from localStorage:', error);
		return [];
	}
};

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
	const [highlight, setHighlight] = useState(false);
	const chartRef = useRef<HTMLDivElement>(null);

	// Load data from localStorage on mount
	useEffect(() => {
		const storedData = loadChartDataFromStorage();
		if (storedData.length > 0) {
			setChartData(storedData);
			setIsLoading(false);
		} else {
			// Fallback to fetching initial data if no localStorage data
			fetchInitialData();
		}
	}, []);

	// Trigger highlight effect when new data arrives
	const triggerHighlight = useCallback(() => {
		setHighlight(true);
		setTimeout(() => setHighlight(false), 1000); // 1 second highlight
	}, []);

	// Fetch initial data from API
	const fetchInitialData = async () => {
		try {
			const response = await fetch('/api/sensors/chart-data');
			if (response.ok) {
				const data = await response.json();
				const formattedData = data.map((point: any) => ({
					...point,
					time: formatTimeEN(point.timestamp || point.time)
				}));
				setChartData(formattedData);
				saveChartDataToStorage(formattedData);
			}
		} catch (error) {
			console.error('Failed to fetch initial chart data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle WebSocket data updates
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
					// Add new point and keep only last MAX_CHART_POINTS
					const updated = [...prev, newDataPoint];
					const latest = updated.slice(-MAX_CHART_POINTS);

					// Save to localStorage
					saveChartDataToStorage(latest);

					// Trigger highlight effect
					triggerHighlight();

					return latest;
				});

				setIsLoading(false);
			}
		}
	}, [persistentSensorData, isConnected, triggerHighlight]);

	if (isLoading) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	// Check if chartData is empty to prevent accessing undefined properties
	if (chartData.length === 0) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
				<div className="text-center">
					<h6 className="text-muted">No chart data available</h6>
					<p className="text-muted">Waiting for sensor data...</p>
				</div>
			</div>
		);
	}

	const data = {
		labels: [...chartData].reverse().map(point => {
			if (!point || !point.time) return 'N/A';
			return point.time;
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
				suggestedMin: Math.min(...chartData.map(point =>
					Math.min(point.temperature || 0, point.humidity || 0)
				)) - 5,
				suggestedMax: Math.max(...chartData.map(point =>
					Math.max(point.temperature || 0, point.humidity || 0)
				)) + 5,
				ticks: {
					display: true,
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
		<div
			ref={chartRef}
			className={`chart-container ${highlight ? 'highlight-effect' : ''}`}
			style={{ height: '400px', position: 'relative' }}
		>
			<Line data={data} options={options} />
		</div>
	);
};

export default AppLineChart;
