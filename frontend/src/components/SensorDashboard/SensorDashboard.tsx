// SensorDashboard component - Uses WebSocket data only (as requested)
// This component shows real-time sensor data from MQTT/WebSocket
// Chart components use API data for historical/processed data

import React from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import './SensorDashboard.css';

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
	// Special handling for binary sensors
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
	} else if (title === 'Water Level') {
		if (value === '1') {
			displayValue = 'Full';
			displayUnit = '';
		} else if (value === '0') {
			displayValue = 'None';
			displayUnit = '';
		} else if (value === '--' || value === '' || value === null || value === undefined) {
			displayValue = 'N/A';
			displayUnit = '';
		}
	} else if (title === 'Light Level') {
		if (value === '1') {
			displayValue = 'Bright';
			displayUnit = '';
		} else if (value === '0') {
			displayValue = 'Dark';
			displayUnit = '';
		} else if (value === '--' || value === '' || value === null || value === undefined) {
			displayValue = 'N/A';
			displayUnit = '';
		}
	} else if (title === 'Rain Status') {
		if (value === '1' || value === 'true') {
			displayValue = 'Raining';
			displayUnit = '';
		} else if (value === '0' || value === 'false') {
			displayValue = 'No Rain';
			displayUnit = '';
		} else if (value === '--' || value === '' || value === null || value === undefined) {
			displayValue = 'N/A';
			displayUnit = '';
		}
	} else {
		// For other sensors, display "N/A" if value is invalid or empty
		displayValue = value === '--' || value === '' || value === null || value === undefined ? 'N/A' : value;
	}

	const isValidValue = displayValue !== 'N/A';

	return (
		<div className="sensor-card">
			<div className="sensor-card-body">
				<div className={`sensor-icon ${color}`} style={{ opacity: isValidValue ? 1 : 0.5 }}>
					{icon}
				</div>
				<div className="sensor-content">
					<div className="sensor-title">{title}</div>
					<div className="sensor-value" style={{ color: isValidValue ? 'inherit' : '#6c757d' }}>
						{displayValue} {isValidValue && displayUnit && <small className="sensor-unit">{displayUnit}</small>}
					</div>
				</div>
			</div>
		</div>
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
		height: { value: '--', timestamp: null }, // Plant height
		motion: { value: '--', timestamp: null } // Motion detection
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
						// Special handling for binary sensors (soil, water, light, rain, motion)
						let formattedValue: string;
						if (['soil', 'water', 'light', 'rain', 'motion'].includes(sensorType)) {
							// For binary sensors, show status text instead of numbers
							if (sensorType === 'soil') {
								formattedValue = numericValue === 1 ? 'Ẩm' : 'Khô';
							} else if (sensorType === 'water') {
								formattedValue = numericValue === 1 ? 'Đủ' : 'Thấp';
							} else if (sensorType === 'light') {
								formattedValue = numericValue === 1 ? 'Sáng' : 'Tối';
							} else if (sensorType === 'rain') {
								formattedValue = numericValue === 1 ? 'Mưa' : 'Khô ráo';
							} else if (sensorType === 'motion') {
								formattedValue = numericValue === 1 ? 'Có' : 'Không';
							} else {
								formattedValue = numericValue.toString();
							}
						} else {
							formattedValue = numericValue.toFixed(1); // Format other sensors with 1 decimal
						}

						updatedSensors[sensorType as keyof typeof sensors] = {
							value: formattedValue,
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
			// Show loading when disconnected but don't clear existing data immediately
			console.log('📡 WebSocket disconnected - keeping last known data');
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
			unit: '', // Binary: Wet/Dry
			icon: '🌱',
			color: 'success'
		},
		{
			key: 'water',
			title: 'Water Level',
			unit: '', // Binary: None/Full
			icon: '🚰',
			color: 'primary'
		},
		{
			key: 'light',
			title: 'Light Level',
			unit: '', // Binary: Dark/Bright
			icon: '☀️',
			color: 'warning'
		},
		{
			key: 'rain',
			title: 'Rain Status',
			unit: '', // Binary: No Rain/Raining
			icon: '🌧️',
			color: 'secondary'
		},
		{
			key: 'height',
			title: 'Plant Height',
			unit: 'cm',
			icon: '📏',
			color: 'info'
		},
		{
			key: 'motion',
			title: 'Motion Detection',
			unit: '', // Binary: No Motion/Motion Detected
			icon: '👁️',
			color: 'dark'
		}
	];

	return (
		<div className="sensor-dashboard">
			<div className="dashboard-header">
				<h2 className="dashboard-title">Sensor Dashboard</h2>
				<div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
					{isConnected ? '🟢 Live Data' : '🔴 Disconnected'}
				</div>
			</div>

			<div className="sensor-grid">
				{sensorCards.map(({ key, title, unit, icon, color }) => (
					<SensorCard
						key={key}
						title={title}
						value={sensors[key as keyof typeof sensors].value}
						unit={unit}
						icon={icon}
						color={color}
					/>
				))}
			</div>

			{lastUpdateTime && (
				<div className="last-update">
					<small>
						Last update: {lastUpdateTime} (UTC+7)
					</small>
				</div>
			)}
		</div>
	);
};

export default SensorDashboard;
