"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Card, Row, Col, Badge } from 'react-bootstrap';

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

interface SensorCardProps {
	title: string;
	value: string;
	unit: string;
	icon: string;
	color: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon, color }) => {
	// Special handling for soil moisture (binary values)
	let displayValue = value;
	let displayUnit = unit;

	if (title === 'Soil Moisture') {
		if (value === '1') {
			displayValue = 'Wet';
			displayUnit = '';
		} else if (value === '0') {
			displayValue = 'Dry';
			displayUnit = '';
		} else if (value === '--' || value === '' || value === null || value === undefined) {
			displayValue = 'N/A';
			displayUnit = '';
		}
	} else {
		// For other sensors, display "N/A" if value is invalid or empty
		displayValue = value === '--' || value === '0' || value === '' || value === null || value === undefined ? 'N/A' : value;
	}

	const isValidValue = displayValue !== 'N/A';

	return (
		<Card className="h-100 shadow-sm" style={{ outline: 'none', border: 'none', borderRadius: '12px', boxShadow: '0 6px 15px rgba(0, 0, 0, 0.08)' }}>
			<Card.Body className="d-flex align-items-center">
				<div className={`me-3 fs-1 text-${color}`} style={{ opacity: isValidValue ? 1 : 0.5 }}>
					{icon}
				</div>
				<div>
					<Card.Title className="mb-1 fs-6">{title}</Card.Title>
					<Card.Text className="mb-0 fs-4 fw-bold" style={{ color: isValidValue ? 'inherit' : '#6c757d' }}>
						{displayValue} {isValidValue && displayUnit && <small className="text-muted">{displayUnit}</small>}
					</Card.Text>
				</div>
			</Card.Body>
		</Card>
	);
};

const SensorDashboard: React.FC = () => {
	const { persistentSensorData, isConnected } = useWebSocketContext();
	const [sensors, setSensors] = React.useState({
		temperature: { value: '--', timestamp: null },
		humidity: { value: '--', timestamp: null },
		soil: { value: '--', timestamp: null },
		water: { value: '--', timestamp: null },
		light: { value: '--', timestamp: null },
		rain: { value: '--', timestamp: null },
		height: { value: '--', timestamp: null } // Plant height
	});
	const [lastUpdateTime, setLastUpdateTime] = React.useState<string>('');

	// Update sensors from persistent data
	React.useEffect(() => {
		if (persistentSensorData && isConnected) {
			const updatedSensors = { ...sensors };
			let latestTimestamp = '';

			// Update each sensor that has data
			Object.entries(persistentSensorData).forEach(([sensorType, sensorInfo]: [string, any]) => {
				if (sensorInfo && sensorInfo.value !== undefined && sensorInfo.value !== null) {
					// Only update with valid numeric values
					const numericValue = parseFloat(sensorInfo.value);
					if (!isNaN(numericValue)) {
						updatedSensors[sensorType as keyof typeof sensors] = {
							value: numericValue.toFixed(1),
							timestamp: sensorInfo.timestamp
						};

						// Track latest update time
						if (!latestTimestamp || new Date(sensorInfo.timestamp) > new Date(latestTimestamp)) {
							latestTimestamp = sensorInfo.timestamp;
						}
					}
				}
			});

			setSensors(updatedSensors);
			if (latestTimestamp) {
				setLastUpdateTime(formatTimeVN(latestTimestamp));
			}

			console.log('📊 SensorDashboard updated with persistent data');
		} else if (!isConnected) {
			// Show N/A when disconnected
			setSensors({
				temperature: { value: 'N/A', timestamp: null },
				humidity: { value: 'N/A', timestamp: null },
				soil: { value: 'N/A', timestamp: null },
				water: { value: 'N/A', timestamp: null },
				light: { value: 'N/A', timestamp: null },
				rain: { value: 'N/A', timestamp: null },
				height: { value: 'N/A', timestamp: null }
			});
		}
	}, [persistentSensorData, isConnected]);

	const sensorCards = [
		{
			key: 'temperature',
			title: 'Temperature',
			unit: '°C',
			icon: '🌡️',
			color: 'danger'
		},
		{
			key: 'humidity',
			title: 'Humidity',
			unit: '%',
			icon: '💧',
			color: 'info'
		},
		{
			key: 'soil',
			title: 'Soil Moisture',
			unit: '',
			icon: '🌱',
			color: 'success'
		},
		{
			key: 'water',
			title: 'Water Level',
			unit: '',
			icon: '🚰',
			color: 'primary'
		},
		{
			key: 'light',
			title: 'Light Level',
			unit: 'lux',
			icon: '☀️',
			color: 'warning'
		},
		{
			key: 'rain',
			title: 'Rain Status',
			unit: '',
			icon: '🌧️',
			color: 'secondary'
		},
		{
			key: 'height',
			title: 'Plant Height',
			unit: 'cm',
			icon: '📏',
			color: 'info'
		}
	];

	const containerStyle = {
		outline: 'none'
	};

	return (
		<div style={containerStyle}>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2 style={{ color: '#2b512b', fontSize: '1.6rem', outline: 'none' }}>Sensor Dashboard</h2>
				<Badge bg={isConnected ? 'success' : 'danger'} style={{ outline: 'none' }}>
					{isConnected ? '🟢 Live Data' : '🔴 Disconnected'}
				</Badge>
			</div>

			<Row className="g-3" style={{ outline: 'none' }}>
				{sensorCards.map(({ key, title, unit, icon, color }) => (
					<Col key={key} xs={12} sm={6} lg={4} style={{ outline: 'none' }}>
						<SensorCard
							title={title}
							value={sensors[key as keyof typeof sensors].value}
							unit={unit}
							icon={icon}
							color={color}
						/>
					</Col>
				))}
			</Row>

			{lastUpdateTime && (
				<div className="mt-3" style={{ outline: 'none' }}>
					<small className="text-muted">
						Last update: {lastUpdateTime} (UTC+7)
					</small>
				</div>
			)}
		</div>
	);
};

export default SensorDashboard;
