'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Form } from 'react-bootstrap';
import ActivityCard from '@/components/ActivityCard/ActivityCard';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import styles from './control.module.scss';

export const dynamic = 'force-dynamic';

const Control = () => {
	const { sensorData, sendDeviceControl, isConnected } = useWebSocketContext();
	const [switchStates, setSwitchStates] = useState(new Map<string, boolean>());
	const [userInteraction, setUserInteraction] = useState(false);
	const [autoMode, setAutoMode] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	// Sensor values state
	const [sensorValues, setSensorValues] = useState({
		humidity: 0,
		temperature: 0,
		rain: 0,
		waterlevel: 0,
		soil: 0,
		light: 0
	});

	const activities = useMemo(() => [
		{
			title: 'Lighting System',
			icon: '💡',
			device: 'light',
			description: 'LED grow lights for optimal plant growth'
		},
		{
			title: 'Ventilation Fan',
			icon: '🌬️',
			device: 'fan',
			description: 'Air circulation and temperature control'
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
		const action = state ? 'HIGH' : 'LOW';
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

		// Light control based on light sensor
		if (sensor === 'light') {
			const shouldTurnOn = numValue < 500;
			setSwitchStates((prev) => {
				const currentState = prev.get('light') || false;
				if (currentState !== shouldTurnOn) {
					sendDeviceControl('light', shouldTurnOn ? 'HIGH' : 'LOW');
					return new Map(prev).set('light', shouldTurnOn);
				}
				return prev;
			});
		}

		// Fan control based on temperature
		if (sensor === 'temperature') {
			const shouldTurnOn = numValue > 28;
			setSwitchStates((prev) => {
				const currentState = prev.get('fan') || false;
				if (currentState !== shouldTurnOn) {
					sendDeviceControl('fan', shouldTurnOn ? 'HIGH' : 'LOW');
					return new Map(prev).set('fan', shouldTurnOn);
				}
				return prev;
			});
		}

		// Pump control based on soil moisture
		if (sensor === 'soil') {
			const shouldTurnOn = numValue < 30;
			setSwitchStates((prev) => {
				const currentState = prev.get('pump') || false;
				if (currentState !== shouldTurnOn) {
					sendDeviceControl('pump', shouldTurnOn ? 'HIGH' : 'LOW');
					return new Map(prev).set('pump', shouldTurnOn);
				}
				return prev;
			});
		}

		// Window control based on temperature and humidity
		if (sensor === 'temperature' || sensor === 'humidity') {
			const shouldOpen = currentSensorValues.temperature > 30 || currentSensorValues.humidity > 80;
			setSwitchStates((prev) => {
				const currentState = prev.get('window') || false;
				if (currentState !== shouldOpen) {
					sendDeviceControl('window', shouldOpen ? 'HIGH' : 'LOW');
					return new Map(prev).set('window', shouldOpen);
				}
				return prev;
			});
		}
	}, [autoMode, userInteraction, sendDeviceControl]);

	// Process sensor data from WebSocket - Fixed dependency issues
	useEffect(() => {
		if (!sensorData) return;

		const { sensor, data } = sensorData;
		let value = typeof data === 'object' ? data.value : data;

		console.log(`📊 Processing sensor data: ${sensor} = ${value}`);
		setLastUpdate(new Date());

		// Update sensor values
		setSensorValues(prev => {
			const newValues = { ...prev };
			switch (sensor) {
				case 'humidity':
					newValues.humidity = parseFloat(value);
					break;
				case 'temperature':
					newValues.temperature = parseFloat(value);
					break;
				case 'rain':
					newValues.rain = parseInt(value, 10);
					break;
				case 'water':
					newValues.waterlevel = parseFloat(value);
					break;
				case 'soil':
					newValues.soil = parseFloat(value);
					break;
				case 'light':
					newValues.light = parseInt(value, 10);
					break;
				default:
					console.log(`🔍 Unknown sensor: ${sensor}`);
			}

			// Run automation logic with current sensor values
			automationLogic(sensor, value, newValues);

			return newValues;
		});
	}, [sensorData, automationLogic]); // Reduced dependencies

	const getSensorStatus = useCallback((sensor: string, value: number) => {
		switch (sensor) {
			case 'temperature':
				if (value < 18) return { status: 'danger', text: 'Too Cold' };
				if (value > 32) return { status: 'danger', text: 'Too Hot' };
				if (value > 28) return { status: 'warning', text: 'Warm' };
				return { status: 'success', text: 'Optimal' };
			case 'humidity':
				if (value < 40) return { status: 'warning', text: 'Low' };
				if (value > 80) return { status: 'danger', text: 'High' };
				return { status: 'success', text: 'Good' };
			case 'soil':
				if (value < 30) return { status: 'danger', text: 'Dry' };
				if (value > 70) return { status: 'warning', text: 'Wet' };
				return { status: 'success', text: 'Moist' };
			default:
				return { status: 'info', text: 'Normal' };
		}
	}, []);

	return (
		<Container fluid className={styles.controlContainer}>
			{/* Header Section */}
			<Row className="mb-4">
				<Col>
					<div className={styles.header}>
						<h2 className={styles.title}>🎛️ Greenhouse Control Center</h2>
						<p className={styles.subtitle}>
							Monitor and control your smart greenhouse devices and automation
						</p>
					</div>
				</Col>
			</Row>

			{/* Status Bar */}
			<Row className="mb-4">
				<Col lg={6}>
					<Card className={styles.statusCard}>
						<Card.Body>
							<div className={styles.statusItem}>
								<span>Connection Status:</span>
								<Badge bg={isConnected ? 'success' : 'danger'}>
									{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
								</Badge>
							</div>
						</Card.Body>
					</Card>
				</Col>
				<Col lg={6}>
					<Card className={styles.statusCard}>
						<Card.Body>
							<div className={styles.statusItem}>
								<span>Automation Mode:</span>
								<Form.Check
									type="switch"
									id="auto-mode-switch"
									label={autoMode ? "🤖 Auto" : "👤 Manual"}
									checked={autoMode}
									onChange={toggleAutoMode}
									disabled={!isConnected}
								/>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Alerts */}
			{userInteraction && autoMode && (
				<Alert variant="info" className="mb-4">
					<Alert.Heading>Manual Override Active</Alert.Heading>
					<p>Auto-control is temporarily disabled due to manual interaction. It will resume in 5 minutes.</p>
				</Alert>
			)}

			{!isConnected && (
				<Alert variant="warning" className="mb-4">
					<Alert.Heading>Connection Lost</Alert.Heading>
					<p>Unable to connect to the greenhouse system. Please check your network connection.</p>
				</Alert>
			)}

			{/* Device Control Section */}
			<Row className="mb-4">
				<Col>
					<h4 className={styles.sectionTitle}>Device Controls</h4>
				</Col>
			</Row>

			<Row>
				{activities.map((activity, index) => (
					<Col lg={4} md={6} sm={12} key={index} className="mb-4">
						<div className={!isConnected ? styles.disabled : ''}>
							<Card className={styles.deviceCard}>
								<Card.Body>
									<div className={styles.deviceHeader}>
										<span className={styles.deviceIcon}>{activity.icon}</span>
										<div>
											<h6 className={styles.deviceTitle}>{activity.title}</h6>
											<small className={styles.deviceDescription}>{activity.description}</small>
										</div>
									</div>
									<ActivityCard
										{...activity}
										switchId={activity.device}
										switchState={switchStates.get(activity.device) || false}
										onSwitchChange={isConnected ? (state) => handleSwitchChange(activity.device, state) : undefined}
									/>
								</Card.Body>
							</Card>
						</div>
					</Col>
				))}
			</Row>

			{/* Sensor Monitor Section */}
			<Row className="mt-5">
				<Col>
					<h4 className={styles.sectionTitle}>Sensor Monitor</h4>
					<p className={styles.lastUpdate}>
						Last Update: {lastUpdate.toLocaleTimeString()}
					</p>
				</Col>
			</Row>

			<Row>
				<Col lg={4} md={6} className="mb-3">
					<Card className={styles.sensorCard}>
						<Card.Body>
							<div className={styles.sensorHeader}>
								<span className={styles.sensorIcon}>🌡️</span>
								<div>
									<h6>Temperature</h6>
									<Badge bg={getSensorStatus('temperature', sensorValues.temperature).status}>
										{getSensorStatus('temperature', sensorValues.temperature).text}
									</Badge>
								</div>
							</div>
							<div className={styles.sensorValue}>
								{sensorValues.temperature.toFixed(1)}°C
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4} md={6} className="mb-3">
					<Card className={styles.sensorCard}>
						<Card.Body>
							<div className={styles.sensorHeader}>
								<span className={styles.sensorIcon}>💧</span>
								<div>
									<h6>Humidity</h6>
									<Badge bg={getSensorStatus('humidity', sensorValues.humidity).status}>
										{getSensorStatus('humidity', sensorValues.humidity).text}
									</Badge>
								</div>
							</div>
							<div className={styles.sensorValue}>
								{sensorValues.humidity.toFixed(1)}%
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4} md={6} className="mb-3">
					<Card className={styles.sensorCard}>
						<Card.Body>
							<div className={styles.sensorHeader}>
								<span className={styles.sensorIcon}>🌱</span>
								<div>
									<h6>Soil Moisture</h6>
									<Badge bg={getSensorStatus('soil', sensorValues.soil).status}>
										{getSensorStatus('soil', sensorValues.soil).text}
									</Badge>
								</div>
							</div>
							<div className={styles.sensorValue}>
								{sensorValues.soil.toFixed(1)}%
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4} md={6} className="mb-3">
					<Card className={styles.sensorCard}>
						<Card.Body>
							<div className={styles.sensorHeader}>
								<span className={styles.sensorIcon}>☀️</span>
								<div>
									<h6>Light Level</h6>
									<Badge bg="info">Normal</Badge>
								</div>
							</div>
							<div className={styles.sensorValue}>
								{sensorValues.light} lux
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4} md={6} className="mb-3">
					<Card className={styles.sensorCard}>
						<Card.Body>
							<div className={styles.sensorHeader}>
								<span className={styles.sensorIcon}>🪣</span>
								<div>
									<h6>Water Level</h6>
									<Badge bg={sensorValues.waterlevel < 20 ? 'danger' : 'success'}>
										{sensorValues.waterlevel < 20 ? 'Low' : 'Good'}
									</Badge>
								</div>
							</div>
							<div className={styles.sensorValue}>
								{sensorValues.waterlevel.toFixed(1)}%
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4} md={6} className="mb-3">
					<Card className={styles.sensorCard}>
						<Card.Body>
							<div className={styles.sensorHeader}>
								<span className={styles.sensorIcon}>🌧️</span>
								<div>
									<h6>Rain Sensor</h6>
									<Badge bg={sensorValues.rain ? 'primary' : 'secondary'}>
										{sensorValues.rain ? 'Raining' : 'Clear'}
									</Badge>
								</div>
							</div>
							<div className={styles.sensorValue}>
								{sensorValues.rain ? 'Yes' : 'No'}
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default Control;
