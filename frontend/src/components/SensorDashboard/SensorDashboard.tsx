// SensorDashboard component - Uses WebSocket data only (as requested)
// This component shows real-time sensor data from MQTT/WebSocket
// Chart components use API data for historical/processed data

import React from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import './SensorDashboard.css';

// Format time to English format with Vietnam timezone
const formatTimeEN = (timestamp?: string | Date) => {
	if (!timestamp) return new Date().toLocaleString('en-US', {
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
	return date.toLocaleString('en-US', {
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
		height: { value: '--', timestamp: null } // Plant height
	});
	const [lastUpdateTime, setLastUpdateTime] = React.useState<string>('');
	const [highlight, setHighlight] = React.useState(false);

	// Trigger highlight effect when data changes
	const triggerHighlight = React.useCallback(() => {
		setHighlight(true);
		setTimeout(() => setHighlight(false), 1000);
	}, []);
	React.useEffect(() => {
		if (persistentSensorData && isConnected) {
			const updatedSensors = { ...sensors };
			let latestTimestamp = '';
			let hasUpdates = false;

			// Update each sensor that has data
			Object.entries(persistentSensorData).forEach(([sensorType, sensorInfo]: [string, any]) => {
				if (sensorInfo && sensorInfo.value !== undefined && sensorInfo.value !== null) {
					// Only update with valid numeric values
					const numericValue = parseFloat(sensorInfo.value);
					if (!isNaN(numericValue)) {
						// Special handling for binary sensors (soil, water, light, rain)
						let formattedValue: string;
						if (['soil', 'water', 'light', 'rain'].includes(sensorType)) {
							// For binary sensors, show status text instead of numbers
							if (sensorType === 'soil') {
								formattedValue = numericValue === 1 ? 'Wet' : 'Dry';
							} else if (sensorType === 'water') {
								formattedValue = numericValue === 1 ? 'Full' : 'Low';
							} else if (sensorType === 'light') {
								formattedValue = numericValue === 1 ? 'Bright' : 'Dark';
							} else if (sensorType === 'rain') {
								formattedValue = numericValue === 1 ? 'Raining' : 'Clear';
							} else {
								formattedValue = numericValue.toString();
							}
						} else {
							formattedValue = numericValue.toFixed(1); // Format other sensors with 1 decimal
						}

						// Check if this is a new value
						const currentValue = sensors[sensorType as keyof typeof sensors]?.value;
						if (currentValue !== formattedValue) {
							hasUpdates = true;
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
				setLastUpdateTime(formatTimeEN(latestTimestamp));
			}

			// Trigger highlight effect when new data arrives
			if (hasUpdates) {
				triggerHighlight();
			}

		} else if (!isConnected) {
			// Show loading when disconnected but don't clear existing data immediately
		}
	}, [persistentSensorData, isConnected, sensors, triggerHighlight]);

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
		}
	];

	return (
		<div className={`sensor-dashboard ${highlight ? 'highlight' : ''}`}>
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
