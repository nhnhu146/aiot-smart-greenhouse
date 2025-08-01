/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Form } from 'react-bootstrap';
import AppLineChart from '@/components/LineChart/LineChart';
import SensorDashboard from '@/components/SensorDashboard/SensorDashboard';
import ActivityCard from '@/components/ActivityCard/ActivityCard';
import withAuth from '@/components/withAuth/withAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import useWebSocket from '@/hooks/useWebSocket';
import mockDataService, { type SensorData } from '@/services/mockDataService';
import './DashboardPage.css';

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

const DashboardPage = () => {
	const { persistentSensorData, sendDeviceControl, isConnected } = useWebSocketContext();
	const [data, setData] = useState<SensorData | null>(null);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	// Device control states
	const [switchStates, setSwitchStates] = useState(new Map<string, boolean>());
	const [userInteraction, setUserInteraction] = useState(false);
	const [autoMode, setAutoMode] = useState(false);
	// Voice command states
	const [latestVoiceCommand, setLatestVoiceCommand] = useState<VoiceCommand | null>(null);
	// Device control highlight
	const [deviceControlHighlight, setDeviceControlHighlight] = useState(false);

	const { socket } = useWebSocket();

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

		// Trigger device control highlight
		setDeviceControlHighlight(true);
		setTimeout(() => setDeviceControlHighlight(false), 1000);

		// Clear user interaction flag after 5 minutes to re-enable auto mode
		setTimeout(() => setUserInteraction(false), 5 * 60 * 1000);
	}, [sendDeviceControl]);

	const toggleAutoMode = useCallback(async () => {
		const newAutoMode = !autoMode;
		setAutoMode(newAutoMode);
		setUserInteraction(false); // Enable auto control when turning on auto mode
	}, [autoMode]);

	// Format timestamp for display
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) {
			return timestamp;
		}
		return date.toLocaleString("en-GB", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	// Handle real-time persistent sensor data updates
	useEffect(() => {
		if (persistentSensorData) {
			const { temperature, humidity, soil } = persistentSensorData;

			// Create sensor data object from persistent state - always try to use persistent data
			const sensorDataObj: SensorData = {
				temperature: temperature?.value || 0,
				humidity: humidity?.value || 0,
				soilMoisture: soil?.value || 0, // Changed from 'moisture' to 'soilMoisture' to match backend
				timestamp: new Date().toISOString()
			};

			// Always update with persistent data if available, regardless of connection status
			if (temperature || humidity || soil) {
				setData(sensorDataObj);
				setIsUsingMockData(false);
				setIsLoading(false); // Stop loading once we have data

			}
		}
	}, [persistentSensorData]);

	// WebSocket listener for real-time voice command updates
	useEffect(() => {
		if (socket) {
			const handleVoiceCommand = (data: VoiceCommand) => {
				setLatestVoiceCommand(data);
			};

			socket.on("voice-command", handleVoiceCommand);
			socket.on("voice-command-history", handleVoiceCommand);

			return () => {
				socket.off("voice-command", handleVoiceCommand);
				socket.off("voice-command-history", handleVoiceCommand);
			};
		}
	}, [socket]);

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
		<Container className="dashboard-container">
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

			{/* Real-time Sensor Dashboard - WebSocket data only */}
			<Row className="mb-4">
				<Col>
					<SensorDashboard />
				</Col>
			</Row>

			{/* Latest Voice Command Section */}
			<Row className="mb-4">
				<Col>
					<Card className="latest-voice-card">
						<Card.Header>
							<h5 className="mb-0">🎤 Latest Voice Command</h5>
						</Card.Header>
						<Card.Body>
							{latestVoiceCommand ? (
								<Row>
									<Col md={3}>
										<strong>Command:</strong> <code>{latestVoiceCommand.command}</code>
									</Col>
									<Col md={2}>
										<strong>Time:</strong> {formatDateTime(latestVoiceCommand.timestamp)}
									</Col>
									<Col md={2}>
										<strong>Confidence:</strong>{' '}
										<Badge bg={latestVoiceCommand.confidence && latestVoiceCommand.confidence >= 0.9 ? "success" : latestVoiceCommand.confidence && latestVoiceCommand.confidence >= 0.7 ? "warning" : "secondary"}>
											{latestVoiceCommand.confidence != null ? (latestVoiceCommand.confidence * 100).toFixed(0) + '%' : 'N/A'}
										</Badge>
									</Col>
									<Col md={2}>
										<strong>Status:</strong>{' '}
										<Badge bg={latestVoiceCommand.errorMessage ? "danger" : latestVoiceCommand.processed ? "success" : "secondary"}>
											{latestVoiceCommand.errorMessage ? "Error" : latestVoiceCommand.processed ? "Processed" : "Pending"}
										</Badge>
									</Col>
									{latestVoiceCommand.errorMessage && (
										<Col md={3}>
											<strong>Error:</strong> <span className="text-danger">{latestVoiceCommand.errorMessage}</span>
										</Col>
									)}
								</Row>
							) : (
								<div className="text-muted">No voice commands received yet</div>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Device Control Section */}
			<Row className="mb-4">
				<Col>
					<Card className={`control-card ${deviceControlHighlight ? 'highlight' : ''}`}>
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
											disabled={autoMode}
										/>
									</Col>
								))}
							</Row>
							<div className="d-flex gap-3 align-items-center mb-3">
								<Badge bg={autoMode ? "success" : "secondary"}>
									Auto Mode: {autoMode ? "ON" : "OFF"}
								</Badge>
								<Badge bg={userInteraction ? "warning" : "info"}>
									User Interaction: {userInteraction ? "Active" : "Inactive"}
								</Badge>
							</div>
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

			{/* Charts Section - API data only, NO doughnut cards */}
			<Row className="my-3 align-items-center justify-content-center chart-row">
				<Col sm={12}>
					<Card className="chart-card">
						<Card.Body className="chart-title">Sensor Data Trends</Card.Body>
						<div className="my-3">
							<AppLineChart />
						</div>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default withAuth(DashboardPage);
