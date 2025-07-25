/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Form } from 'react-bootstrap';
import AppLineChart from '@/components/LineChart/LineChart';
import AppSemiDoughnutChart from '@/components/SemiDoughnutChart/SemiDoughnutChart';
import SensorDashboard from '@/components/SensorDashboard/SensorDashboard';
import ActivityCard from '@/components/ActivityCard/ActivityCard';
import withAuth from '@/components/withAuth/withAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import mockDataService, { type SensorData } from '@/services/mockDataService';
import styles from './dashboard.module.scss';

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
	const { persistentSensorData, sensorData, sendDeviceControl, isConnected } = useWebSocketContext();
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

	// Device control states
	const [switchStates, setSwitchStates] = useState(new Map<string, boolean>());
	const [userInteraction, setUserInteraction] = useState(false);
	const [autoMode, setAutoMode] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	// Sensor values state - Use null for no data available
	const [sensorValues, setSensorValues] = useState({
		humidity: null as number | null,
		temperature: null as number | null,
		rain: null as number | null,
		waterlevel: null as number | null,
		soil: null as number | null,
		light: null as number | null,
		height: null as number | null // Plant height in cm
	});

	const activities = useMemo(() => [
		{
			title: 'Lighting System',
			icon: '💡',
			device: 'light',
			description: 'LED grow lights for optimal plant growth'
		},
		{
			title: 'Water Pump',
			icon: '💧',
			device: 'pump',
			description: 'Automated watering system'
		},
		{
			title: 'Window Control',
			icon: '🪟',
			device: 'window',
			description: 'Automated window opening/closing'
		},
		{
			title: 'Door Access',
			icon: '🚪',
			device: 'door',
			description: 'Greenhouse door management'
		},
	], []);

	const handleSwitchChange = useCallback((device: string, state: boolean) => {
		setSwitchStates((prev) => new Map(prev).set(device, state));

		// Map device and state to proper action format
		let action: string;
		if (['light', 'pump'].includes(device)) {
			action = state ? 'on' : 'off';
		} else if (['door', 'window'].includes(device)) {
			action = state ? 'open' : 'close';
		} else {
			action = state ? 'on' : 'off'; // fallback
		}

		sendDeviceControl(device, action);
		setUserInteraction(true);

		// Clear user interaction flag after 5 minutes to re-enable auto mode
		setTimeout(() => setUserInteraction(false), 5 * 60 * 1000);
	}, [sendDeviceControl]);

	const toggleAutoMode = useCallback(() => {
		setAutoMode(prev => {
			const newAutoMode = !prev;
			if (newAutoMode) {
				setUserInteraction(false); // Enable auto control when turning on auto mode
			}
			return newAutoMode;
		});
	}, []);

	// Memoize automation logic to prevent unnecessary rerenders
	const automationLogic = useCallback((sensor: string, value: any, currentSensorValues: any) => {
		if (!autoMode || userInteraction) return;

		const numValue = typeof value === 'object' ? value.value : parseFloat(value);
		if (isNaN(numValue)) return;

		// Light control based on light sensor
		if (sensor === 'light') {
			const shouldTurnOn = numValue < 500;
			setSwitchStates((prev) => {
				const currentState = prev.get('light') || false;
				if (currentState !== shouldTurnOn) {
					sendDeviceControl('light', shouldTurnOn ? 'on' : 'off');
					return new Map(prev).set('light', shouldTurnOn);
				}
				return prev;
			});
		}

		// Pump control based on soil moisture (binary: 0=dry, 1=wet)
		if (sensor === 'soil') {
			const shouldTurnOn = numValue === 0; // If soil moisture = 0 (dry), turn on pump
			setSwitchStates((prev) => {
				const currentState = prev.get('pump') || false;
				if (currentState !== shouldTurnOn) {
					sendDeviceControl('pump', shouldTurnOn ? 'on' : 'off');
					return new Map(prev).set('pump', shouldTurnOn);
				}
				return prev;
			});
		}

		// NOTE: Fan control removed as per requirement #4
		// Temperature-based automation can be added for other devices if needed
	}, [autoMode, userInteraction, sendDeviceControl]);

	// Helper function to safely parse sensor values
	const parseSensorValue = useCallback((value: any): number | null => {
		if (value === null || value === undefined) return null;
		if (typeof value === 'object' && value.value !== undefined) {
			return parseFloat(value.value);
		}
		const parsed = parseFloat(value);
		return isNaN(parsed) ? null : parsed;
	}, []);

	// Handle real-time sensor data from WebSocket
	useEffect(() => {
		if (sensorData) {
			console.log('🔄 Processing real-time sensor data:', sensorData);

			const newSensorValues = {
				humidity: parseSensorValue(sensorData.humidity),
				temperature: parseSensorValue(sensorData.temperature),
				rain: parseSensorValue(sensorData.rain),
				waterlevel: parseSensorValue(sensorData.waterlevel),
				soil: parseSensorValue(sensorData.soil),
				light: parseSensorValue(sensorData.light),
				height: parseSensorValue(sensorData.height) // Plant height
			};

			setSensorValues(newSensorValues);
			setLastUpdate(new Date());

			// Apply automation logic for each sensor
			Object.entries(newSensorValues).forEach(([sensor, value]) => {
				if (value !== null) {
					automationLogic(sensor, value, newSensorValues);
				}
			});
		}
	}, [sensorData, parseSensorValue, automationLogic]);

	// Handle real-time persistent sensor data updates
	useEffect(() => {
		if (persistentSensorData) {
			const { temperature, humidity, soil } = persistentSensorData;

			// Create sensor data object from persistent state - always try to use persistent data
			const sensorDataObj: SensorData = {
				temperature: temperature?.value || 0,
				humidity: humidity?.value || 0,
				moisture: soil?.value || 0,
				timestamp: new Date().toISOString()
			};

			// Always update with persistent data if available, regardless of connection status
			if (temperature || humidity || soil) {
				setData(sensorDataObj);
				setIsUsingMockData(false);
				setIsLoading(false); // Stop loading once we have data

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
	}, [persistentSensorData]);

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

	if (isLoading && !data) {
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

	// Only show "No data available" if we've finished loading and truly have no data
	if (!isLoading && !data && !persistentSensorData) {
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
				<h3>Smart Greenhouse Dashboard</h3>
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

			{/* Device Control Section */}
			<Row className="mb-4">
				<Col>
					<Card className={styles.controlCard}>
						<Card.Header className="d-flex justify-content-between align-items-center">
							<h5 className="mb-0">🎛️ Device Control Center</h5>
							<div className="d-flex align-items-center gap-3">
								<Form.Check
									type="switch"
									id="auto-mode-switch"
									label={`Auto Mode ${autoMode ? 'ON' : 'OFF'}`}
									checked={autoMode}
									onChange={toggleAutoMode}
									className={autoMode ? 'text-success' : 'text-warning'}
								/>
								{userInteraction && (
									<Badge bg="warning" text="dark">
										Manual Override Active
									</Badge>
								)}
							</div>
						</Card.Header>
						<Card.Body>
							{!isConnected && (
								<Alert variant="warning" className="mb-3">
									⚠️ WebSocket disconnected. Device control may not work properly.
								</Alert>
							)}

							<Row>
								{activities.map((activity) => (
									<Col key={activity.device} lg={4} md={6} className="mb-3">
										<ActivityCard
											title={activity.title}
											icon={activity.icon}
											switchId={activity.device}
											switchState={switchStates.get(activity.device) || false}
											onSwitchChange={(state: boolean) => handleSwitchChange(activity.device, state)}
										/>
									</Col>
								))}
							</Row>

							{/* Automation Status */}
							{autoMode && !userInteraction && (
								<Alert variant="info" className="mt-3 mb-0">
									🤖 <strong>Automation Active:</strong> Devices are being controlled automatically based on sensor readings.
									<br />
									<small>
										• Light: ON when light level = 0 (dark) |
										• Pump: ON when soil moisture = 0 (dry) |
										• Devices controlled automatically
									</small>
								</Alert>
							)}

							{userInteraction && (
								<Alert variant="warning" className="mt-3 mb-0">
									👋 <strong>Manual Control:</strong> User interaction detected. Automation will resume in 5 minutes.
								</Alert>
							)}

							{!autoMode && (
								<Alert variant="secondary" className="mt-3 mb-0">
									⏸️ <strong>Auto Mode Disabled:</strong> All devices are under manual control.
								</Alert>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Charts Section */}
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
				<Col md={6}>
					<Card className={styles.doughnutCard}>
						<AppSemiDoughnutChart
							label="Humidity"
							value={data?.humidity || 0}
							maxValue={90}
							unit='%'
						/>
					</Card>
				</Col>
				<Col md={6}>
					<Card className={styles.doughnutCard}>
						<AppSemiDoughnutChart
							label="Temperature"
							value={data?.temperature || 0}
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