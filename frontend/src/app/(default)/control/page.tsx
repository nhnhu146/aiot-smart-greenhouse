"use client";

import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ActivityCard from '../../../components/ActivityCard/ActivityCard';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import pushNoti from '@/hooks/pushNoti';
import styles from './control.module.scss';

interface EmailData {
	to: string;
	subject: string;
	text: string;
}

// Sensor data state
var Humidity = 0, Temperature = 0, Rain = 0, Waterlevel = 0, Moisture = 0, LightLevel = 0, PIRValue = 0;
var noti_sent = false, last_water_state = false;

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
					// Handle other sensor types
					break;
			}

			// Automatic control logic (only if user hasn't manually interacted recently)
			if (!userInteraction) {
				// Light control based on light sensor
				if (sensor === 'light') {
					const shouldTurnOn = LightLevel > 2000;
					const currentLightState = switchStates.get('light') || false;
					if (shouldTurnOn !== currentLightState) {
						setSwitchStates((prev) => new Map(prev).set('light', shouldTurnOn));
						sendDeviceControl('light', shouldTurnOn ? 'HIGH' : 'LOW');
					}
				}

				// Ventilation control based on humidity, temperature, and rain
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

				// Watering control based on soil moisture and water level
				if ((sensor === 'soil' || sensor === 'water') && Moisture > 0 && Waterlevel >= 0) {
					const shouldTurnOnPump = Moisture > 4000 && Waterlevel === 1;
					const currentPumpState = switchStates.get('pump');

					// Water level notifications
					if (Waterlevel === 1 && last_water_state === false) {
						noti_sent = false;
						last_water_state = true;
					}

					if (Waterlevel === 0 && noti_sent === false) {
						pushNoti("Smart Greenhouse Notification", "Water level is low. Please refill the water tank");
						sendEmail({
							to: 'admin@greenhouse.com',
							subject: 'Smart Greenhouse Notification',
							text: 'Water level is low. Please refill the water tank',
						});
						noti_sent = true;
						last_water_state = false;
					}

					if (shouldTurnOnPump !== currentPumpState) {
						setSwitchStates((prev) => new Map(prev).set('pump', shouldTurnOnPump));
						sendDeviceControl('pump', shouldTurnOnPump ? 'HIGH' : 'LOW');
					}
				}
			}
		}
	}, [sensorData, userInteraction, switchStates]);

	// Reset user interaction flag after some time
	useEffect(() => {
		if (userInteraction) {
			const timer = setTimeout(() => {
				setUserInteraction(false);
			}, 30000); // 30 seconds

			return () => clearTimeout(timer);
		}
	}, [userInteraction]);

	async function sendEmail(emailData: EmailData) {
		try {
			const res = await fetch('/api/send-mail', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emailData),
			});
			const data = await res.json();
			if (data.success) {
				console.log('Email sent successfully:', data.response);
			} else {
				console.error('Failed to send email:', data.error);
			}
		} catch (error) {
			console.error('Error while sending email:', error);
		}
	}

	return (
		<Container className={styles["activity-container"]}>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className={styles["activity-title"]}>Let&apos;s check your GreenHouse activity</h3>
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
