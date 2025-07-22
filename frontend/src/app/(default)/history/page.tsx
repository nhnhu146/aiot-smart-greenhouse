/* eslint-disable react-hooks/exhaustive-deps */
'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import mockDataService, { type ChartDataPoint } from '@/services/mockDataService';
import styles from './history.module.scss';

const History = () => {
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Format timestamp to display date-time consistently
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);

		// Check if it's a valid date
		if (isNaN(date.getTime())) {
			// If it's already a formatted string, return as is
			return timestamp;
		}

		// Format as dd/mm/yyyy hh:mm:ss
		return date.toLocaleString('en-GB', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	};

	// Fetch data when component is mounted
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Check if mock data is enabled in settings
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					// Use mock data
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log('🎭 Using mock history data (enabled in settings)');
				} else {
					// Try to get real data from API
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(result.isMock);
					console.log(result.isMock ? '🎭 Fallback to mock data (API unavailable)' : '✅ Using real history data from API');
				}

				setIsLoading(false);
			} catch (error) {
				console.error('Failed to fetch history data:', error);
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// Listen for mock data setting changes
	useEffect(() => {
		const handleMockDataChange = (event: CustomEvent) => {
			console.log('🔧 Mock data setting changed in history:', event.detail.enabled);

			// Force re-fetch data with new setting
			const fetchData = async () => {
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log('🎭 History switched to mock data');
				} else {
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(result.isMock);
					console.log(result.isMock ? '🎭 History fallback to mock data (API unavailable)' : '✅ History switched to real data');
				}
			};

			fetchData();
		};

		// @ts-ignore
		window.addEventListener('mockDataChanged', handleMockDataChange);

		return () => {
			// @ts-ignore
			window.removeEventListener('mockDataChanged', handleMockDataChange);
		};
	}, []);

	return (
		<Container className={styles.historyContainer}>
			<h3 className={styles.heading}>Let&apos;s explore your Cloud history</h3>
			<div className={`alert ${isUsingMockData ? 'alert-warning' : 'alert-success'} ${styles.alertBanner}`}>
				{isUsingMockData
					? '🎭 Using mock data for development'
					: '📊 Using production data'
				}
			</div>
			{isLoading ? (
				<p className={styles.statusMessage}>Loading data...</p>
			) : data.length === 0 ? (
				<p className={styles.statusMessage}>No data available</p>
			) : (
				data.map((entry: ChartDataPoint, index: number) => (
					<Card
						key={index}
						className={styles.historyCard}
					>
						<Card.Body>
							<p className={styles.timeStamp}><b>Time:</b> {formatDateTime(entry.time)}</p>
							<p className={styles.sensorData}>
								<span className={styles.sensorItem}><b>Temperature:</b> {entry.temperature?.toFixed(1) || 'N/A'}°C</span>
								<span className={styles.sensorItem}><b>Humidity:</b> {entry.humidity?.toFixed(1) || 'N/A'}%</span>
								<span className={styles.sensorItem}><b>Soil Moisture:</b> {entry.soilMoisture?.toFixed(1) || 'N/A'}%</span>
								<span className={styles.sensorItem}><b>Plant Height:</b> {entry.plantHeight?.toFixed(1) || 'N/A'}cm</span>
							</p>
						</Card.Body>
					</Card>
				))
			)}
		</Container>
	);
};

export default History;
