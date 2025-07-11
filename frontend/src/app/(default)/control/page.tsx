"use client";
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ActivityCard from '@/components/ActivityCard/ActivityCard';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import styles from './control.module.scss';

// Sensor data state
var Humidity = 0, Temperature = 0, Rain = 0, Waterlevel = 0, Moisture = 0, LightLevel = 0;
var last_water_state = false;

const Control = () => {
	const { sensorData, sendDeviceControl, isConnected } = useWebSocketContext();
	const [switchStates, setSwitchStates] = useState(new Map<string, boolean>());
	const [userInteraction, setUserInteraction] = useState(false);

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
			switch (sensor) {
				case 'humidity':
					Humidity = parseFloat(value);
					break;
				case 'temperature':
					Temperature = parseFloat(value);
					break;
				case 'rain':
					Rain = parseInt(value, 10);
					break;
				case 'water':
					Waterlevel = parseFloat(value);
					break;
				case 'soil':
					Moisture = parseFloat(value);
					break;
				case 'light':
					LightLevel = parseInt(value, 10);
					break;
				default:
					break;
			}

			// Automatic control logic (only if user hasn't manually interacted recently)
			if (!userInteraction) {
				// Light control
				if (sensor === 'light') {
					const shouldTurnOn = LightLevel > 2000;
					const currentLightState = switchStates.get('light') || false;
					if (shouldTurnOn !== currentLightState) {
						setSwitchStates((prev) => new Map(prev).set('light', shouldTurnOn));
						sendDeviceControl('light', shouldTurnOn ? 'HIGH' : 'LOW');
					}
				}

				// Ventilation control
				if ((sensor === 'humidity' || sensor === 'temperature' || sensor === 'rain') &&
					Humidity > 0 && Temperature > 0 && Rain >= 0) {
					const shouldOpenWindow = Humidity > 30 && Temperature > 20 && Rain < 200;
					const shouldOpenFan = Humidity > 30 && Temperature > 20 && Rain >= 200;

					const currentFanState = switchStates.get('fan');
					const currentWindowState = switchStates.get('window');

					if (shouldOpenWindow !== currentWindowState) {
						setSwitchStates((prev) => new Map(prev).set('window', shouldOpenWindow));
						sendDeviceControl('window', shouldOpenWindow ? 'HIGH' : 'LOW');
					}

					if (shouldOpenFan !== currentFanState) {
						setSwitchStates((prev) => new Map(prev).set('fan', shouldOpenFan));
						sendDeviceControl('fan', shouldOpenFan ? 'HIGH' : 'LOW');
					}
				}

				// Watering control
				if ((sensor === 'soil' || sensor === 'water') && Moisture > 0 && Waterlevel >= 0) {
					const shouldTurnOnPump = Moisture > 4000 && Waterlevel === 1;
					const currentPumpState = switchStates.get('pump');

					// Reset notification state
					if (Waterlevel === 1 && last_water_state === false) {
						last_water_state = true;
					}

					if (Waterlevel === 0 && last_water_state === true) {
						last_water_state = false;
					}

					if (shouldTurnOnPump !== currentPumpState) {
						setSwitchStates((prev) => new Map(prev).set('pump', shouldTurnOnPump));
						sendDeviceControl('pump', shouldTurnOnPump ? 'HIGH' : 'LOW');
					}
				}
			}
		}
	}, [sensorData, userInteraction, switchStates, sendDeviceControl]);

	// Reset user interaction flag after some time
	useEffect(() => {
		if (userInteraction) {
			const timer = setTimeout(() => {
				setUserInteraction(false);
			}, 30000);

			return () => clearTimeout(timer);
		}
	}, [userInteraction]);

	return (
		<Container className={styles["activity-container"]}>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className={styles["activity-title"]}>Let&apos;s control your Greenhouse devices</h3>
				<div className={`badge ${isConnected ? 'bg-success' : 'bg-danger'}`}>
					{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
				</div>
			</div>
			<Row className={styles["activity-row"]}>
				{activities.map((activity, index) => (
					<Col key={index} xs={12} md={6} lg={4} className={styles["activity-card-wrapper"]}>
						<ActivityCard
							title={activity.title}
							icon={activity.icon}
							switchId={`switch-${activity.title}`}
							switchState={switchStates.get(activity.device) || false}
							onSwitchChange={(state) => handleSwitchChange(activity.device, state)}
						/>
					</Col>
				))}
			</Row>
		</Container>
	);
};

export default Control;
