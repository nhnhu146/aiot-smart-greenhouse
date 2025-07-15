"use client";
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ActivityCard from '@/components/ActivityCard/ActivityCard';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import styles from './control.module.scss';

const Control = () => {
	const { sensorData, sendDeviceControl, isConnected } = useWebSocketContext();
	const [switchStates, setSwitchStates] = useState(new Map<string, boolean>());
	const [userInteraction, setUserInteraction] = useState(false);

	// Sensor values state
	const [sensorValues, setSensorValues] = useState({
		humidity: 0,
		temperature: 0,
		rain: 0,
		waterlevel: 0,
		soil: 0,
		light: 0
	});

	const activities = [
		{ title: 'Lights', icon: '💡', device: 'light' },
		{ title: 'Fan', icon: '🌬️', device: 'fan' },
		{ title: 'Watering', icon: '💧', device: 'pump' },
		{ title: 'Window', icon: '🪟', device: 'window' },
		{ title: 'Door', icon: '🚪', device: 'door' },
	];

	const handleSwitchChange = (device: string, state: boolean) => {
		setSwitchStates((prev) => new Map(prev).set(device, state));
		const action = state ? 'HIGH' : 'LOW';
		sendDeviceControl(device, action);
		setUserInteraction(true);
	};

	// Process sensor data from WebSocket
	useEffect(() => {
		if (sensorData) {
			const { sensor, data } = sensorData;
			let value = typeof data === 'object' ? data.value : data;

			console.log(`📊 Processing sensor data: ${sensor} = ${value}`);

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
				return newValues;
			});

			// Automatic control logic (only if user hasn't manually interacted recently)
			if (!userInteraction) {
				// Light control
				if (sensor === 'light') {
					const shouldTurnOn = sensorValues.light > 2000;
					const currentLightState = switchStates.get('light') || false;
					if (currentLightState !== shouldTurnOn) {
						setSwitchStates((prev) => new Map(prev).set('light', shouldTurnOn));
						sendDeviceControl('light', shouldTurnOn ? 'HIGH' : 'LOW');
					}
				}

				// Fan control based on temperature
				if (sensor === 'temperature') {
					const shouldTurnOn = sensorValues.temperature > 28;
					const currentFanState = switchStates.get('fan') || false;
					if (currentFanState !== shouldTurnOn) {
						setSwitchStates((prev) => new Map(prev).set('fan', shouldTurnOn));
						sendDeviceControl('fan', shouldTurnOn ? 'HIGH' : 'LOW');
					}
				}

				// Pump control based on soil moisture
				if (sensor === 'soil') {
					const shouldTurnOn = sensorValues.soil < 30;
					const currentPumpState = switchStates.get('pump') || false;
					if (currentPumpState !== shouldTurnOn) {
						setSwitchStates((prev) => new Map(prev).set('pump', shouldTurnOn));
						sendDeviceControl('pump', shouldTurnOn ? 'HIGH' : 'LOW');
					}
				}

				// Window control based on humidity
				if (sensor === 'humidity') {
					const shouldOpen = sensorValues.humidity > 80;
					const currentWindowState = switchStates.get('window') || false;
					if (currentWindowState !== shouldOpen) {
						setSwitchStates((prev) => new Map(prev).set('window', shouldOpen));
						sendDeviceControl('window', shouldOpen ? 'HIGH' : 'LOW');
					}
				}
			}
		}
	}, [sensorData, userInteraction, switchStates, sendDeviceControl, sensorValues]);

	// Reset user interaction flag after 5 minutes
	useEffect(() => {
		if (userInteraction) {
			const timeout = setTimeout(() => {
				setUserInteraction(false);
			}, 5 * 60 * 1000); // 5 minutes

			return () => clearTimeout(timeout);
		}
	}, [userInteraction]);

	return (
		<Container fluid className={styles.controlContainer}>
			<Row className="mb-4">
				<Col>
					<h2 className={styles.pageTitle}>Device Control</h2>
					<p className={styles.subtitle}>
						Manage your greenhouse devices manually or let the system auto-control based on sensors
					</p>
					<div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
						{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
					</div>
				</Col>
			</Row>

			<Row>
				{activities.map((activity, index) => (
					<Col lg={4} md={6} sm={12} key={index} className="mb-4">
						<div className={!isConnected ? styles.disabled : ''}>
							<ActivityCard
								{...activity}
								switchId={activity.device}
								switchState={switchStates.get(activity.device) || false}
								onSwitchChange={isConnected ? (state) => handleSwitchChange(activity.device, state) : undefined}
							/>
						</div>
					</Col>
				))}
			</Row>

			{/* Sensor Values Display */}
			<Row className="mt-4">
				<Col>
					<div className={styles.sensorDisplay}>
						<h5>Current Sensor Values</h5>
						<div className={styles.sensorGrid}>
							<div className={styles.sensorItem}>
								<span>Temperature:</span>
								<span>{sensorValues.temperature.toFixed(1)}°C</span>
							</div>
							<div className={styles.sensorItem}>
								<span>Humidity:</span>
								<span>{sensorValues.humidity.toFixed(1)}%</span>
							</div>
							<div className={styles.sensorItem}>
								<span>Soil Moisture:</span>
								<span>{sensorValues.soil.toFixed(1)}%</span>
							</div>
							<div className={styles.sensorItem}>
								<span>Light Level:</span>
								<span>{sensorValues.light}</span>
							</div>
							<div className={styles.sensorItem}>
								<span>Water Level:</span>
								<span>{sensorValues.waterlevel.toFixed(1)}%</span>
							</div>
							<div className={styles.sensorItem}>
								<span>Rain:</span>
								<span>{sensorValues.rain ? 'Yes' : 'No'}</span>
							</div>
						</div>
					</div>
				</Col>
			</Row>
		</Container>
	);
};

export default Control;
