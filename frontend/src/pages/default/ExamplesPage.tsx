import { useState } from 'react';
import { Container, Row, Tab, Tabs } from 'react-bootstrap';
import SensorTopicCard from '@/components/ExamplesPage/SensorTopicCard';
import ControlTopicCard from '@/components/ExamplesPage/ControlTopicCard';
import { sensorTopicsData, controlTopicsData } from '@/components/ExamplesPage/topicsData';
import styles from './ExamplesPage.module.css';

const ExamplesPage = () => {
	const [copiedItem, setCopiedItem] = useState<string | null>(null);

	const copyToClipboard = (text: string, itemId: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedItem(itemId);
			setTimeout(() => setCopiedItem(null), 2000);
		});
	};

	const getValueForMQTT = (value: any, dataType: string): string => {
		switch (dataType) {
			case 'Float':
				return value.toFixed(1);
			case 'Integer':
				return value.toString();
			case 'Binary':
				return value.toString();
			case 'String':
				return value;
			default:
				return value.toString();
		}
	};

	return (
		<Container className={styles.container}>
			<h3 className={styles.heading}>🚀 IoT Smart Greenhouse - API Documentation</h3>
			<p className="text-muted mb-4">
				Complete MQTT topics and API endpoints for IoT Smart Greenhouse system integration.
			</p>

			<Tabs defaultActiveKey="sensors" id="examples-tabs" className="mb-4">
				<Tab eventKey="sensors" title="📊 Sensor Topics">
					<Row>
						{sensorTopicsData.map((topic, index) => (
							<SensorTopicCard
								key={index}
								topic={topic}
								index={index}
								copiedItem={copiedItem}
								copyToClipboard={copyToClipboard}
								getValueForMQTT={getValueForMQTT}
							/>
						))}
					</Row>
				</Tab>

				<Tab eventKey="controls" title="🎮 Device Control">
					<Row>
						{controlTopicsData.map((topic, index) => (
							<ControlTopicCard
								key={index}
								topic={topic}
								index={index}
								copiedItem={copiedItem}
								copyToClipboard={copyToClipboard}
								getValueForMQTT={getValueForMQTT}
							/>
						))}
					</Row>
				</Tab>

				<Tab eventKey="api" title="🌐 REST API">
					<div className="mt-4">
						<h5>📊 Backend API Endpoints</h5>
						<div className="bg-light p-3 rounded mb-4">
							<h6>Sensor Data APIs</h6>
							<ul className="mb-0">
								<li><code>GET /api/sensors/latest</code> - Get latest sensor data</li>
								<li><code>GET /api/sensors?page=1&limit=20</code> - Get sensor data list</li>
								<li><code>GET /api/sensors/stats</code> - Get sensor data statistics</li>
								<li><code>GET /api/history</code> - Get history data for sensors, devices, alerts</li>
							</ul>
						</div>

						<div className="bg-light p-3 rounded mb-4">
							<h6>Device Control APIs</h6>
							<ul className="mb-0">
								<li><code>GET /api/devices/status</code> - Get all device status</li>
								<li><code>POST /api/devices/control</code> - Control devices</li>
								<li><code>POST /api/devices/schedule</code> - Schedule device control</li>
							</ul>
						</div>

						<div className="bg-light p-3 rounded mb-4">
							<h6>Dashboard & System APIs</h6>
							<ul className="mb-0">
								<li><code>GET /api/dashboard</code> - Get dashboard overview data</li>
								<li><code>GET /api/automation</code> - Get automation configuration</li>
								<li><code>PUT /api/automation</code> - Update automation configuration</li>
							</ul>
						</div>

						<div className="bg-primary text-white p-3 rounded">
							<h6>📄 API Response Format</h6>
							<pre className="text-white mb-0">{`{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "temperature": 25.5,
    "humidity": 65.0,
    "soilMoisture": 1,
    "waterLevel": 0,
    "lightLevel": 1,
    "rainStatus": 0,
    "plantHeight": 25,
    "motionDetected": 0,
    "deviceId": "esp32-greenhouse-01",
    "dataQuality": "partial",
    "createdAt": "2025-08-02T...",
    "updatedAt": "2025-08-02T..."
  },
  "timestamp": "2025-08-02T..."
}`}</pre>
						</div>
					</div>
				</Tab>

				<Tab eventKey="websocket" title="⚡ WebSocket">
					<div className="mt-4">
						<h5>🔌 WebSocket Connection</h5>
						<div className="bg-light p-3 rounded mb-4">
							<p><strong>URL:</strong> <code>ws://localhost:5000</code></p>
							<p><strong>Events:</strong></p>
							<ul>
								<li><code>sensor-data</code> - Real-time sensor data</li>
								<li><code>sensor:data</code> - General sensor data channel</li>
								<li><code>sensor:temperature</code> - Specific temperature data</li>
								<li><code>sensor:humidity</code> - Specific humidity data</li>
								<li><code>device-status</code> - Device status updates</li>
								<li><code>alert</code> - System alerts</li>
								<li><code>connection-status</code> - Connection status</li>
							</ul>
						</div>

						<div className="bg-success text-white p-3 rounded mb-4">
							<h6>📡 Sensor Data Event Format</h6>
							<pre className="text-white mb-0">{`{
  "topic": "greenhouse/sensors/temperature",
  "sensor": "temperature",
  "data": {
    "value": 25.5,
    "timestamp": "2025-08-02T...",
    "quality": "merged",
    "merged": true
  },
  "timestamp": "2025-08-02T..."
}`}</pre>
						</div>

						<div className="bg-warning text-dark p-3 rounded">
							<h6>🎮 Device Status Event Format</h6>
							<pre className="text-dark mb-0">{`{
  "device": "light",
  "status": {
    "status": true,
    "updatedAt": "2025-08-02T...",
    "deviceType": "light",
    "isOnline": true
  },
  "timestamp": "2025-08-02T..."
}`}</pre>
						</div>
					</div>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default ExamplesPage;
