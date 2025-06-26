'use client';
import { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import axios from 'axios';

const History = () => {
	const [data, setData] = useState<any[]>([]);

	// Fetch data when component is mounted
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get('/api/sensors/history?limit=50');

				if (response.status === 200) {
					let fetchedData = response.data;

					if (Array.isArray(fetchedData)) {
						// Sort data by entryId in descending order
						fetchedData.sort((a, b) => (b.entryId || 0) - (a.entryId || 0));
						setData(fetchedData);
					} else {
						console.error('Data is not an array', fetchedData);
						setData([]);
					}
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};
		fetchData();
	}, []);

	return (
		<Container className="my-3">
			<h3 className="mb-4 mx-2">Let&apos;s check your Cloud!</h3>
			{Array.isArray(data) && data.length === 0 ? (
				<p>Loading data...</p>
			) : (
				Array.isArray(data) && data.map((entry: any, index: number) => (
					<Card
						key={index}
						style={{ width: '100%', height: '100px', borderRadius: '15px', margin: '10px 0', boxShadow: '0 0 10px rgba(87, 174, 9, 0.3)' }}
					>
						<Card.Body>
							<p><b>DateTime:</b> {entry.timestamp || 'N/A'}</p>
							<p>
								<b> Light Level:</b> {entry.lightLevel || 'N/A'}
								<b> Water Level:</b> {entry.waterLevel || 'N/A'}
								<b> Soil Moisture:</b> {entry.soilMoisture || 'N/A'}
								<b> Temperature:</b> {entry.temperature || 'N/A'}°C
								<b> Humidity:</b> {entry.humidity || 'N/A'}%
							</p>
						</Card.Body>
					</Card>
				))
			)}
		</Container>
	);
};

export default History;
