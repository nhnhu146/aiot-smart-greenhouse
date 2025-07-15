"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
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

// Format time to UTC+7 (Vietnam timezone) - showing only HH:MM:SS for charts
const formatTimeVN = (timestamp: string | Date) => {
	const date = new Date(timestamp);
	return date.toLocaleString('vi-VN', {
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
				const currentTime = formatTimeVN(new Date());

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

					console.log('📈 Chart updated with persistent sensor data:', newDataPoint);
					return latest24;
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

				// Format timestamps to UTC+7 with HH:MM:SS format
				const formattedData = result.data.map(point => ({
					...point,
					time: formatTimeVN(point.time)
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

	const data = {
		labels: chartData.map(point => point.time),
		datasets: [
			{
				label: 'Temperature (°C)',
				data: chartData.map(point => Math.round(point.temperature * 10) / 10),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				tension: 0.1,
			},
			{
				label: 'Humidity (%)',
				data: chartData.map(point => Math.round(point.humidity * 10) / 10),
				borderColor: 'rgb(54, 162, 235)',
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				tension: 0.1,
			},
			{
				label: 'Soil Moisture (%)',
				data: chartData.map(point => Math.round(point.soilMoisture * 10) / 10),
				borderColor: 'rgb(75, 192, 192)',
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				tension: 0.1,
			}
		],
	};

	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: true,
				text: 'Sensor Data Trends (Last 24 Hours)',
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				suggestedMax: 100,
			},
		},
	};

	return (
		<div style={{ width: '100%', height: '400px' }}>
			<Line data={data} options={options} />
		</div>
	);
};

export default AppLineChart;
