'use client';
import { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import mockDataService, { type ChartDataPoint } from '@/services/mockDataService';

const History = () => {
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

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
							<p><b>Time:</b> {entry.time}</p>
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
