'use client';
import { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import mockDataService, { type ChartDataPoint } from '@/services/mockDataService';

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
				// Get chart data using mockDataService (handles real/mock fallback)
				const result = await mockDataService.getChartData();

				setData(result.data);
				setIsUsingMockData(result.isMock);
				setIsLoading(false);

				if (result.isMock) {
					console.log('🎭 Using mock history data');
				} else {
					console.log('✅ Using real history data');
				}
			} catch (error) {
				console.error('Failed to fetch history data:', error);
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	return (
		<Container className="my-3">
			<h3 className="mb-4 mx-2">Let&apos;s check your Cloud!</h3>
			{isUsingMockData && (
				<div className="alert alert-info mb-3">
					🎭 Using mock data for development
				</div>
			)}
			{isLoading ? (
				<p>Loading data...</p>
			) : data.length === 0 ? (
				<p>No data available</p>
			) : (
				data.map((entry: ChartDataPoint, index: number) => (
					<Card
						key={index}
						style={{ width: '100%', height: '100px', borderRadius: '15px', margin: '10px 0', boxShadow: '0 0 10px rgba(87, 174, 9, 0.3)' }}
					>
						<Card.Body>
							<p><b>Time:</b> {formatDateTime(entry.time)}</p>
							<p>
								<b> Temperature:</b> {entry.temperature?.toFixed(1) || 'N/A'}°C
								<b> Humidity:</b> {entry.humidity?.toFixed(1) || 'N/A'}%
								<b> Soil Moisture:</b> {entry.soilMoisture?.toFixed(1) || 'N/A'}%
							</p>
						</Card.Body>
					</Card>
				))
			)}
		</Container>
	);
};

export default History;
