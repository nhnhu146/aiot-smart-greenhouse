// SensorDashboard component - Uses WebSocket data only (optimized version)
// This component shows real-time sensor data from MQTT/WebSocket
// Chart components use API data for historical/processed data

import React, { memo, useMemo } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import HighlightWrapper from '@/components/Common/HighlightWrapper';
import SensorCard from './components/SensorCard';
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

const SensorDashboard: React.FC = memo(() => {
	const { persistentSensorData, isConnected } = useWebSocketContext();

	// Memoize sensor data processing to prevent unnecessary re-renders
	const sensors = useMemo(() => {
		const defaultSensors = {
			temperature: { value: '--', timestamp: null },
			humidity: { value: '--', timestamp: null },
			soil: { value: '--', timestamp: null },
			water: { value: '--', timestamp: null },
			light: { value: '--', timestamp: null },
			rain: { value: '--', timestamp: null },
			height: { value: '--', timestamp: null }
		};

		if (!persistentSensorData) return defaultSensors;

		const processedSensors: any = {};

		Object.entries(persistentSensorData).forEach(([sensorType, sensorInfo]: [string, any]) => {
			if (sensorInfo && sensorInfo.value !== undefined && sensorInfo.value !== null) {
				const numericValue = parseFloat(sensorInfo.value);
				if (!isNaN(numericValue)) {
					let formattedValue: string;

					// Special handling for binary sensors
					if (['soil', 'water', 'light', 'rain'].includes(sensorType)) {
						if (sensorType === 'soil') {
							formattedValue = numericValue === 1 ? 'Wet' : 'Dry';
						} else if (sensorType === 'water') {
							formattedValue = numericValue === 1 ? 'Full' : 'Low';
						} else if (sensorType === 'light') {
							formattedValue = numericValue === 1 ? 'Bright' : 'Dark';
						} else if (sensorType === 'rain') {
							formattedValue = numericValue === 1 ? 'Raining' : 'No Rain';
						} else {
							formattedValue = numericValue.toFixed(1);
						}
					} else {
						formattedValue = numericValue.toFixed(1);
					}

					processedSensors[sensorType] = {
						value: formattedValue,
						timestamp: sensorInfo.timestamp || new Date().toISOString()
					};
				}
			}
		});

		return {
			...defaultSensors,
			...processedSensors
		};
	}, [persistentSensorData]);

	// Memoize last update time to prevent unnecessary calculations
	const lastUpdateTime = useMemo(() => {
		const timestamps = Object.values(sensors)
			.map((sensor: any) => sensor.timestamp)
			.filter(Boolean) as string[];

		if (timestamps.length === 0) return '';

		const latestTimestamp = timestamps.reduce((latest, current) =>
			new Date(current) > new Date(latest) ? current : latest
		);

		return formatTimeEN(latestTimestamp);
	}, [sensors]);	// Memoize connection status message
	const connectionStatus = useMemo(() => {
		return isConnected ? 'Connected' : 'Disconnected';
	}, [isConnected]);

	return (
		<div className="sensor-dashboard">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>🌱 Sensor Dashboard</h2>
				<div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
					<span className="status-dot"></span>
					{connectionStatus}
				</div>
			</div>

			{lastUpdateTime && (
				<div className="last-update mb-3">
					<small className="text-muted">Last updated: {lastUpdateTime}</small>
				</div>
			)}

			<div className="row">
				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.temperature.value}>
						<SensorCard
							title="Temperature"
							value={sensors.temperature.value}
							unit="°C"
							icon="🌡️"
							color="text-danger"
						/>
					</HighlightWrapper>
				</div>

				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.humidity.value}>
						<SensorCard
							title="Humidity"
							value={sensors.humidity.value}
							unit="%"
							icon="💧"
							color="text-info"
						/>
					</HighlightWrapper>
				</div>

				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.soil.value}>
						<SensorCard
							title="Soil Moisture"
							value={sensors.soil.value}
							unit=""
							icon="🌱"
							color="text-success"
						/>
					</HighlightWrapper>
				</div>

				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.water.value}>
						<SensorCard
							title="Water Level"
							value={sensors.water.value}
							unit=""
							icon="🚰"
							color="text-primary"
						/>
					</HighlightWrapper>
				</div>

				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.light.value}>
						<SensorCard
							title="Light Level"
							value={sensors.light.value}
							unit=""
							icon="☀️"
							color="text-warning"
						/>
					</HighlightWrapper>
				</div>

				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.rain.value}>
						<SensorCard
							title="Rain Status"
							value={sensors.rain.value}
							unit=""
							icon="🌧️"
							color="text-secondary"
						/>
					</HighlightWrapper>
				</div>

				<div className="col-md-6 col-lg-3 mb-3">
					<HighlightWrapper trigger={sensors.height.value}>
						<SensorCard
							title="Plant Height"
							value={sensors.height.value}
							unit="cm"
							icon="📏"
							color="text-success"
						/>
					</HighlightWrapper>
				</div>
			</div>

			{!isConnected && (
				<div className="alert alert-warning mt-3">
					<strong>⚠️ Connection Lost:</strong> Real-time data is unavailable. Showing last known values.
				</div>
			)}
		</div>
	);
});

SensorDashboard.displayName = 'SensorDashboard';

export default SensorDashboard;
