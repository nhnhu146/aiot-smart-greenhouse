'use client'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import AppLineChart from '@/components/LineChart/LineChart';
import AppSemiDoughnutChart from '@/components/SemiDoughnutChart/SemiDoughnutChart';
import { useEffect, useState } from 'react';
import withAuth from '@/components/withAuth/withAuth';
import mockDataService, { type SensorData } from '@/services/mockDataService';
import DevUtils from '@/components/DevUtils/DevUtils';
import styles from './dashboard.module.scss';

const Dashboard = () => {
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cleanupMockUpdates: (() => void) | null = null;

		const fetchData = async () => {
			try {
				// Get sensor data using mockDataService (handles real/mock fallback)
				const result = await mockDataService.getSensorData();

				setData(result.data);
				setIsUsingMockData(result.isMock);
				setIsLoading(false);

				if (result.isMock) {
					console.log('🎭 Using mock sensor data');
					// Start mock data updates for realistic simulation
					cleanupMockUpdates = mockDataService.startMockDataUpdates(5000);
				} else {
					console.log('✅ Using real sensor data');
				}
			} catch (error) {
				console.error('Failed to fetch sensor data:', error);
				setIsLoading(false);
			}
		};

		fetchData();

		// Cleanup function
		return () => {
			if (cleanupMockUpdates) {
				cleanupMockUpdates();
			}
		};
	}, []);

	// Auto-refresh data every 30 seconds
	useEffect(() => {
		const interval = setInterval(async () => {
			const result = await mockDataService.getSensorData();
			setData(result.data);
			setIsUsingMockData(result.isMock);
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	if (isLoading) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '50vh'
			}}>
				<div>Loading dashboard...</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '50vh'
			}}>
				<div>No data available</div>
			</div>
		);
	}

	return (
		<Container className={styles.dashboardContainer}>
			<DevUtils />
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h3>Welcome to GreenHouse</h3>
				{isUsingMockData && (
					<Badge bg="warning" text="dark" style={{ fontSize: '12px' }}>
						🎭 Demo Mode - Mock Data
					</Badge>
				)}
			</div>

			<Row className={`my-3 align-items-center justify-content-center ${styles.chartRow}`}>
				<Col sm={8}>
					<Card className={styles.chartCard}>
						<Card.Body className={styles.chartTitle}>Development Prediction Chart</Card.Body>
						<div className='my-3'>
							<AppLineChart />
						</div>
					</Card>
				</Col>
			</Row>

			<Row className={`my-3 ${styles.chartRow}`}>
				<Col>
					<Card className={styles.doughnutCard}>
						<Card.Body className={styles.chartTitle}>Humidity</Card.Body>
						<AppSemiDoughnutChart
							label="Humidity"
							value={data.humidity}
							maxValue={90}
							unit='%'
						/>
					</Card>
				</Col>
				<Col>
					<Card className={styles.doughnutCard}>
						<Card.Body className={styles.chartTitle}>Soil moisture</Card.Body>
						<AppSemiDoughnutChart
							label="Moisture"
							value={data.moisture}
							maxValue={100}
							unit='%'
						/>
					</Card>
				</Col>
				<Col>
					<Card className={styles.doughnutCard}>
						<Card.Body className={styles.chartTitle}>Temperature</Card.Body>
						<AppSemiDoughnutChart
							label="Temperature"
							value={data.temperature}
							maxValue={50}
							unit='°C'
						/>
					</Card>
				</Col>
			</Row>
		</Container>
	);
}

export default withAuth(Dashboard);