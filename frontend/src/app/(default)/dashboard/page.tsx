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
import publishMessage from '@/hooks/publishMQTT';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Format time to UTC+7 (Vietnam timezone)
const formatTimeVN = (timestamp?: string | Date) => {
	if (!timestamp) return new Date().toLocaleString('vi-VN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh'
	});

	const date = new Date(timestamp);
	return date.toLocaleString('vi-VN', {
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

const Dashboard = () => {
	const { persistentSensorData, isConnected } = useWebSocketContext();
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

	// Handle real-time persistent sensor data updates
	useEffect(() => {
		if (persistentSensorData && isConnected) {
			const { temperature, humidity, soil } = persistentSensorData;

			// Create sensor data object from persistent state
			if (temperature || humidity || soil) {
				const sensorDataObj: SensorData = {
					temperature: temperature?.value || 0,
					humidity: humidity?.value || 0,
					moisture: soil?.value || 0,
					timestamp: new Date().toISOString()
				};

				setData(sensorDataObj);
				setIsUsingMockData(false);

				// Get latest timestamp from sensors
				const timestamps = [temperature?.timestamp, humidity?.timestamp, soil?.timestamp]
					.filter(Boolean) as string[];

				if (timestamps.length > 0) {
					const latestTimestamp = timestamps.reduce((latest, current) =>
						new Date(current) > new Date(latest) ? current : latest
					);
					setLastUpdateTime(formatTimeVN(latestTimestamp));
				}

				console.log('📊 Dashboard updated from persistent sensor data');
			}
		}
	}, [persistentSensorData, isConnected]);

	// Initial data fetch
	useEffect(() => {
		let cleanupMockUpdates: (() => void) | null = null;

		const fetchData = async () => {
			try {
				// Check if mock data is enabled in settings
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					// Use mock data
					const result = await mockDataService.getSensorData();
					if (result.data) {
						setData(result.data);
						setIsUsingMockData(true);
						setLastUpdateTime(formatTimeVN(result.data.timestamp));
						console.log('🎭 Using mock sensor data (enabled in settings)');

						// Start mock data updates for realistic simulation
						cleanupMockUpdates = mockDataService.startMockDataUpdates(5000);
					}
				} else {
					// Use real data from API as fallback if no persistent data yet
					if (!persistentSensorData || !isConnected) {
						const result = await mockDataService.getSensorData();
						if (result.data) {
							setData(result.data);
							setIsUsingMockData(result.isMock);
							setLastUpdateTime(formatTimeVN(result.data.timestamp));
							console.log(result.isMock ? '🎭 Fallback to mock data (API unavailable)' : '✅ Using real sensor data from API');
						}
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
	}, [persistentSensorData, isConnected]);

	// Listen for mock data setting changes
	useEffect(() => {
		const handleMockDataChange = (event: CustomEvent) => {
			console.log('🔧 Mock data setting changed:', event.detail.enabled);

			// Force re-fetch data with new setting
			const fetchData = async () => {
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					const result = await mockDataService.getSensorData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log('🎭 Switched to mock data');
				} else {
					if (persistentSensorData && isConnected) {
						const { temperature, humidity, soil } = persistentSensorData;
						if (temperature || humidity || soil) {
							const sensorDataObj: SensorData = {
								temperature: temperature?.value || 0,
								humidity: humidity?.value || 0,
								moisture: soil?.value || 0,
								timestamp: new Date().toISOString()
							};
							setData(sensorDataObj);
							setIsUsingMockData(false);
							console.log('🌐 Switched to real-time data');
						}
					} else {
						const result = await mockDataService.getSensorData();
						setData(result.data);
						setIsUsingMockData(result.isMock);
						console.log('🌐 Switched to API data');
					}
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
	}, [persistentSensorData, isConnected]);

	// Auto-refresh data every 30 seconds if not using mock data
	useEffect(() => {
		if (mockDataService.isUsingMockData()) {
			return; // Don't set interval for mock data
		}

		const interval = setInterval(async () => {
			if (isConnected && persistentSensorData) {
				// Use persistent sensor data if available
				const { temperature, humidity, soil } = persistentSensorData;
				if (temperature || humidity || soil) {
					const sensorDataObj: SensorData = {
						temperature: temperature?.value || 0,
						humidity: humidity?.value || 0,
						moisture: soil?.value || 0,
						timestamp: new Date().toISOString()
					};
					setData(sensorDataObj);
					setIsUsingMockData(false);
				}
			} else {
				// Fallback to API
				const result = await mockDataService.getSensorData();
				setData(result.data);
				setIsUsingMockData(result.isMock);
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [persistentSensorData, isConnected]);

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