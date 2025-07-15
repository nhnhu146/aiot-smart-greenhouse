"use client";
/* eslint-disable react-hooks/exhaustive-deps */
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
import mockDataService, { type ChartDataPoint } from '@/services/mockDataService';

// Register the components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AppLineChart: React.FC = () => {
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchChartData = async () => {
			try {
				const result = await mockDataService.getChartData();
				setChartData(result.data);
				setIsLoading(false);

				if (result.isMock) {
					console.log('📊 Using mock chart data');
				} else {
					console.log('📊 Using real chart data');
				}
			} catch (error) {
				console.error('Failed to fetch chart data:', error);
				setIsLoading(false);
			}
		};

		fetchChartData();
	}, []);

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
