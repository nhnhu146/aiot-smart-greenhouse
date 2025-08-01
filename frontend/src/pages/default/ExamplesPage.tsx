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
						<div className="bg-light p-3 rounded mb-4 border">
							<h6 className="text-dark">Sensor Data APIs</h6>
							<ul className="mb-0 text-dark">
								<li><code className="bg-white p-1 rounded border">GET /api/sensors/latest</code> - Get latest sensor data</li>
								<li><code className="bg-white p-1 rounded border">GET /api/sensors?page=1&limit=20&from=2025-01-01&to=2025-12-31</code> - Get paginated sensor data with filters</li>
								<li><code className="bg-white p-1 rounded border">GET /api/sensors/stats</code> - Get sensor data statistics</li>
								<li><code className="bg-white p-1 rounded border">GET /api/sensors/export</code> - Export sensor data as CSV</li>
								<li><code className="bg-white p-1 rounded border">GET /api/history</code> - Get history data for sensors, devices, alerts</li>
							</ul>
						</div>

						<div className="bg-light p-3 rounded mb-4 border">
							<h6 className="text-dark">Device Control APIs</h6>
							<ul className="mb-0 text-dark">
								<li><code className="bg-white p-1 rounded border">GET /api/devices/status</code> - Get all device status</li>
								<li><code className="bg-white p-1 rounded border">POST /api/devices/control</code> - Control devices (body: &#123;deviceType, action, duration&#125;)</li>
								<li><code className="bg-white p-1 rounded border">POST /api/devices/schedule</code> - Schedule device control</li>
								<li><code className="bg-white p-1 rounded border">GET /api/history/device-controls?page=1&deviceType=pump</code> - Get device control history with filters</li>
								<li><code className="bg-white p-1 rounded border">GET /api/history/export/device-controls</code> - Export device controls as CSV</li>
							</ul>
						</div>

						<div className="bg-light p-3 rounded mb-4 border">
							<h6 className="text-dark">Voice Commands & Advanced APIs</h6>
							<ul className="mb-0 text-dark">
								<li><code className="bg-white p-1 rounded border">GET /api/voice-commands?page=1&limit=20</code> - Get voice commands history with pagination</li>
								<li><code className="bg-white p-1 rounded border">POST /api/voice-commands/process</code> - Process voice command (body: &#123;command, confidence&#125;)</li>
								<li><code className="bg-white p-1 rounded border">GET /api/history/export/voice-commands</code> - Export voice commands as CSV</li>
								<li><code className="bg-white p-1 rounded border">GET /api/dashboard</code> - Get dashboard overview data</li>
								<li><code className="bg-white p-1 rounded border">GET /api/automation</code> - Get automation configuration</li>
								<li><code className="bg-white p-1 rounded border">PUT /api/automation</code> - Update automation configuration</li>
							</ul>
						</div>

						<div className="bg-dark text-white p-3 rounded">
							<h6 className="text-white">📄 API Response Format with Pagination</h6>
							<pre className="text-white mb-0">{`{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "sensors": [
      {
        "temperature": 25.5,
        "humidity": 65.0,
        "soilMoisture": 1,
        "waterLevel": 0,
        "lightLevel": 1,
        "rainStatus": false,
        "plantHeight": 25,
        "motionDetected": false,
        "createdAt": "2025-08-02T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "dateRange": {"from": "2025-01-01", "to": "2025-12-31"},
      "valueRanges": {"temperature": {"min": 20, "max": 30}},
      "specificValues": {"soilMoisture": 1, "rainStatus": false}
    }
  },
  "timestamp": "2025-08-02T..."
}`}</pre>
						</div>
					</div>
				</Tab>

				<Tab eventKey="websocket" title="⚡ WebSocket">
					<div className="mt-4">
						<h5>🔌 WebSocket Connection</h5>
						<div className="bg-light p-3 rounded mb-4 border">
							<p className="text-dark"><strong>URL:</strong> <code className="bg-white p-1 rounded border">ws://localhost:5000</code></p>
							<p className="text-dark"><strong>Events:</strong></p>
							<ul className="text-dark">
								<li><code className="bg-white p-1 rounded border">sensor-data</code> - Real-time sensor data</li>
								<li><code className="bg-white p-1 rounded border">sensor:data</code> - General sensor data channel</li>
								<li><code className="bg-white p-1 rounded border">sensor:temperature</code> - Specific temperature data</li>
								<li><code className="bg-white p-1 rounded border">sensor:humidity</code> - Specific humidity data</li>
								<li><code className="bg-white p-1 rounded border">device-status</code> - Device status updates</li>
								<li><code className="bg-white p-1 rounded border">alert</code> - System alerts</li>
								<li><code className="bg-white p-1 rounded border">connection-status</code> - Connection status</li>
								<li><code className="bg-white p-1 rounded border">voice-command</code> - Voice command updates</li>
							</ul>
						</div>

						<div className="bg-success text-white p-3 rounded mb-4">
							<h6 className="text-white">📡 Sensor Data Event Format</h6>
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

						<div className="bg-warning text-dark p-3 rounded mb-4">
							<h6 className="text-dark">🎮 Device Status Event Format</h6>
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

						<div className="bg-info text-white p-3 rounded">
							<h6 className="text-white">🎤 Voice Command Event Format</h6>
							<pre className="text-white mb-0">{`{
  "id": "voice_cmd_123",
  "command": "turn on the pump",
  "confidence": 0.95,
  "timestamp": "2025-08-02T...",
  "processed": true,
  "response": "Pump turned on successfully",
  "errorMessage": null
}`}</pre>
						</div>
					</div>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default ExamplesPage;
