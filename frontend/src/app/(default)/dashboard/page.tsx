/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import AppLineChart from '@/components/LineChart/LineChart';
import AppSemiDoughnutChart from '@/components/SemiDoughnutChart/SemiDoughnutChart';
import SensorDashboard from '@/components/SensorDashboard/SensorDashboard';
import withAuth from '@/components/withAuth/withAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import mockDataService, { type SensorData } from '@/services/mockDataService';
import styles from './dashboard.module.scss';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const Dashboard = () => {
	const { sensorData, isConnected } = useWebSocketContext();
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cleanupMockUpdates: (() => void) | null = null;

		const fetchData = async () => {
			try {
				// Check if mock data is enabled in settings
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					// Use mock data
					const result = await mockDataService.getSensorData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log('🎭 Using mock sensor data (enabled in settings)');

					// Start mock data updates for realistic simulation
					cleanupMockUpdates = mockDataService.startMockDataUpdates(5000);
				} else {
					// Use real data from WebSocket if available
					if (sensorData && isConnected) {
						setData(sensorData.data);
						setIsUsingMockData(false);
						console.log('✅ Using real sensor data from WebSocket');
					} else {
						// Fallback to API if WebSocket not available
						const result = await mockDataService.getSensorData();
						setData(result.data);
						setIsUsingMockData(result.isMock);
						console.log(result.isMock ? '🎭 Fallback to mock data (API unavailable)' : '✅ Using real sensor data from API');
					}
				}

				setIsLoading(false);
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
	}, [sensorData, isConnected]);

	// Real-time WebSocket data updates when not using mock data
	useEffect(() => {
		if (!mockDataService.isUsingMockData() && sensorData && isConnected) {
			// Format WebSocket data to match expected SensorData interface
			const formattedData = {
				humidity: sensorData.data?.humidity || 0,
				moisture: sensorData.data?.soilMoisture || sensorData.data?.moisture || 0,
				temperature: sensorData.data?.temperature || 0,
				timestamp: sensorData.timestamp || new Date().toISOString()
			};

			setData(formattedData);
			setIsUsingMockData(false);
			console.log('🌐 Real-time sensor data from WebSocket:', formattedData);
		}
	}, [sensorData, isConnected]);

	// Auto-refresh data every 30 seconds if not using mock data
	useEffect(() => {
		if (mockDataService.isUsingMockData()) {
			return; // Don&apos;t set interval for mock data
		}

		const interval = setInterval(async () => {
			if (isConnected && sensorData) {
				// Use WebSocket data if available
				setData(sensorData.data);
				setIsUsingMockData(false);
			} else {
				// Fallback to API
				const result = await mockDataService.getSensorData();
				setData(result.data);
				setIsUsingMockData(result.isMock);
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [sensorData, isConnected]);

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
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h3>Welcome to GreenHouse</h3>
				<div className="d-flex gap-2">
					{isUsingMockData && (
						<Badge bg="warning" text="dark" style={{ fontSize: '12px' }}>
							🎭 Demo Mode - Mock Data
						</Badge>
					)}
					{!isUsingMockData && (
						<Badge bg="success" text="light" style={{ fontSize: '12px' }}>
							📊 Production Data
						</Badge>
					)}
					<Badge bg={isConnected ? 'success' : 'danger'} style={{ fontSize: '12px' }}>
						{isConnected ? '🟢 WebSocket Connected' : '🔴 WebSocket Disconnected'}
					</Badge>
				</div>
			</div>

			{/* Real-time Sensor Dashboard */}
			<Row className="mb-4">
				<Col>
					<SensorDashboard />
				</Col>
			</Row>

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