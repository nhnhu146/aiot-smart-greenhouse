'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { Container, Card, Row, Col, Badge, Button, Alert, Form } from 'react-bootstrap';
import styles from './mqtt-examples.module.scss';

interface ExampleTopic {
	name: string;
	topic: string;
	description: string;
	dataType: 'number' | 'boolean' | 'json';
	examples: {
		value: any;
		description: string;
	}[];
	unit?: string;
	range?: { min: number; max: number };
}

const MQTTExamples = () => {
	const [copiedTopic, setCopiedTopic] = useState<string | null>(null);

	const sensorTopics: ExampleTopic[] = [
		{
			name: 'Temperature Sensor',
			topic: 'greenhouse/sensors/temperature',
			description: 'Temperature measurement in greenhouse',
			dataType: 'number',
			unit: '°C',
			range: { min: -10, max: 50 },
			examples: [
				{ value: 25.5, description: 'Normal temperature' },
				{ value: 35.8, description: 'High temperature warning' },
				{ value: 15.2, description: 'Low temperature' },
				{ value: 22.0, description: 'Optimal growing temperature' }
			]
		},
		{
			name: 'Humidity Sensor',
			topic: 'greenhouse/sensors/humidity',
			description: 'Air humidity percentage in greenhouse',
			dataType: 'number',
			unit: '%',
			range: { min: 0, max: 100 },
			examples: [
				{ value: 65.5, description: 'Optimal humidity level' },
				{ value: 85.0, description: 'High humidity' },
				{ value: 40.2, description: 'Low humidity warning' },
				{ value: 70.8, description: 'Good humidity for plants' }
			]
		},
		{
			name: 'Soil Moisture',
			topic: 'greenhouse/sensors/soil',
			description: 'Soil moisture level measurement',
			dataType: 'number',
			unit: '%',
			range: { min: 0, max: 100 },
			examples: [
				{ value: 45.3, description: 'Good soil moisture' },
				{ value: 25.1, description: 'Dry soil - watering needed' },
				{ value: 75.8, description: 'Very moist soil' },
				{ value: 55.0, description: 'Optimal moisture for most plants' }
			]
		},
		{
			name: 'Water Level',
			topic: 'greenhouse/sensors/water',
			description: 'Water reservoir level monitoring',
			dataType: 'number',
			unit: '%',
			range: { min: 0, max: 100 },
			examples: [
				{ value: 80.5, description: 'Good water level' },
				{ value: 15.2, description: 'Low water alert' },
				{ value: 95.0, description: 'Tank almost full' },
				{ value: 50.0, description: 'Half tank level' }
			]
		},
		{
			name: 'Plant Height',
			topic: 'greenhouse/sensors/height',
			description: 'Plant growth height measurement',
			dataType: 'number',
			unit: 'cm',
			range: { min: 0, max: 200 },
			examples: [
				{ value: 25.5, description: 'Young plant' },
				{ value: 45.8, description: 'Medium growth' },
				{ value: 78.2, description: 'Good growth progress' },
				{ value: 120.0, description: 'Mature plant height' }
			]
		},
		{
			name: 'Rain Sensor',
			topic: 'greenhouse/sensors/rain',
			description: 'Rain detection status',
			dataType: 'boolean',
			examples: [
				{ value: 0, description: 'No rain detected' },
				{ value: 1, description: 'Rain detected' }
			]
		},
		{
			name: 'Light Level',
			topic: 'greenhouse/sensors/light',
			description: 'Light intensity measurement',
			dataType: 'number',
			unit: 'lux',
			range: { min: 0, max: 100000 },
			examples: [
				{ value: 15000, description: 'Good daylight' },
				{ value: 5000, description: 'Low light condition' },
				{ value: 35000, description: 'Bright sunlight' },
				{ value: 800, description: 'Artificial lighting' }
			]
		},
		{
			name: 'Motion Sensor',
			topic: 'greenhouse/sensors/motion',
			description: 'Motion detection in greenhouse',
			dataType: 'boolean',
			examples: [
				{ value: 0, description: 'No motion detected' },
				{ value: 1, description: 'Motion detected' }
			]
		}
	];

	const deviceTopics: ExampleTopic[] = [
		{
			name: 'Light Control',
			topic: 'greenhouse/devices/light/control',
			description: 'Control LED grow lights',
			dataType: 'json',
			examples: [
				{
					value: { action: 'turn_on', value: 100, timestamp: '2025-07-15T10:30:00Z' },
					description: 'Turn on lights at 100% brightness'
				},
				{
					value: { action: 'turn_off', timestamp: '2025-07-15T18:00:00Z' },
					description: 'Turn off lights'
				},
				{
					value: { action: 'set_brightness', value: 75, timestamp: '2025-07-15T14:00:00Z' },
					description: 'Set brightness to 75%'
				},
				{
					value: { action: 'toggle', timestamp: '2025-07-15T12:00:00Z' },
					description: 'Toggle light state'
				}
			]
		},
		{
			name: 'Water Pump Control',
			topic: 'greenhouse/devices/pump/control',
			description: 'Control irrigation water pump',
			dataType: 'json',
			examples: [
				{
					value: { action: 'start_watering', value: 30, timestamp: '2025-07-15T08:00:00Z' },
					description: 'Start watering for 30 seconds'
				},
				{
					value: { action: 'stop_watering', timestamp: '2025-07-15T08:00:30Z' },
					description: 'Stop watering immediately'
				},
				{
					value: { action: 'set_flow_rate', value: 50, timestamp: '2025-07-15T08:15:00Z' },
					description: 'Set pump flow rate to 50%'
				}
			]
		},
		{
			name: 'Door Control',
			topic: 'greenhouse/devices/door/control',
			description: 'Control greenhouse door',
			dataType: 'json',
			examples: [
				{
					value: { action: 'open', timestamp: '2025-07-15T09:00:00Z' },
					description: 'Open greenhouse door'
				},
				{
					value: { action: 'close', timestamp: '2025-07-15T17:00:00Z' },
					description: 'Close greenhouse door'
				},
				{
					value: { action: 'set_position', value: 50, timestamp: '2025-07-15T12:00:00Z' },
					description: 'Set door to 50% open position'
				}
			]
		},
		{
			name: 'Window Control',
			topic: 'greenhouse/devices/window/control',
			description: 'Control greenhouse windows for ventilation',
			dataType: 'json',
			examples: [
				{
					value: { action: 'open', timestamp: '2025-07-15T11:00:00Z' },
					description: 'Open windows for ventilation'
				},
				{
					value: { action: 'close', timestamp: '2025-07-15T19:00:00Z' },
					description: 'Close windows'
				},
				{
					value: { action: 'set_position', value: 25, timestamp: '2025-07-15T13:00:00Z' },
					description: 'Partially open windows (25%)'
				}
			]
		}
	];

	const copyToClipboard = async (text: string, topic: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedTopic(topic);
			setTimeout(() => setCopiedTopic(null), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const formatValue = (value: any, dataType: string): string => {
		if (dataType === 'json') {
			return JSON.stringify(value, null, 2);
		}
		return value.toString();
	};

	const getValueForMQTT = (value: any, dataType: string): string => {
		if (dataType === 'json') {
			return JSON.stringify(value);
		}
		return value.toString();
	};

	return (
		<Container className={styles.examplesContainer}>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h3>MQTT Topics & Examples</h3>
				<Badge bg="info" className="fs-6">
					📡 Communication Guide
				</Badge>
			</div>

			<Alert variant="info" className="mb-4">
				<Alert.Heading>📚 How to Use</Alert.Heading>
				<p className="mb-2">
					Use any MQTT client (like MQTT Explorer, mosquitto_pub, or IoT devices) to publish messages to these topics.
				</p>
				<p className="mb-0">
					<strong>MQTT Broker:</strong> <code>localhost:1883</code> (default) or your configured broker URL
				</p>
			</Alert>

			{/* Sensor Topics */}
			<h4 className="mb-3">🌡️ Sensor Data Topics</h4>
			<p className="text-muted mb-3">
				These topics are used by IoT sensors to send data to the greenhouse monitoring system.
			</p>

			<Row>
				{sensorTopics.map((topic, index) => (
					<Col md={6} lg={4} key={index} className="mb-4">
						<Card className="h-100">
							<Card.Header className="d-flex justify-content-between align-items-center">
								<strong>{topic.name}</strong>
								<Badge bg="primary">{topic.dataType}</Badge>
							</Card.Header>
							<Card.Body>
								<div className="mb-3">
									<small className="text-muted d-block">Topic:</small>
									<code
										className="user-select-all cursor-pointer text-break"
										onClick={() => copyToClipboard(topic.topic, topic.topic)}
										title="Click to copy"
									>
										{topic.topic}
									</code>
									{copiedTopic === topic.topic && (
										<small className="text-success d-block mt-1">✓ Copied!</small>
									)}
								</div>

								<p className="small text-muted mb-3">{topic.description}</p>

								{topic.unit && (
									<div className="mb-2">
										<Badge bg="secondary" className="me-2">Unit: {topic.unit}</Badge>
									</div>
								)}

								{topic.range && (
									<div className="mb-3">
										<small className="text-muted">
											Range: {topic.range.min} - {topic.range.max} {topic.unit}
										</small>
									</div>
								)}

								<h6>Example Values:</h6>
								{topic.examples.map((example, exampleIndex) => (
									<div key={exampleIndex} className="mb-2 p-2 bg-light rounded">
										<div className="d-flex justify-content-between align-items-start mb-1">
											<code
												className="text-primary cursor-pointer"
												onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${topic.topic}_${exampleIndex}`)}
												title="Click to copy value"
											>
												{formatValue(example.value, topic.dataType)}
											</code>
											{copiedTopic === `${topic.topic}_${exampleIndex}` && (
												<small className="text-success">✓</small>
											)}
										</div>
										<small className="text-muted">{example.description}</small>
									</div>
								))}
							</Card.Body>
						</Card>
					</Col>
				))}
			</Row>

			{/* Device Control Topics */}
			<h4 className="mb-3 mt-5">🔧 Device Control Topics</h4>
			<p className="text-muted mb-3">
				These topics are used to send commands to IoT devices for controlling greenhouse equipment.
			</p>

			<Row>
				{deviceTopics.map((topic, index) => (
					<Col md={6} lg={6} key={index} className="mb-4">
						<Card className="h-100">
							<Card.Header className="d-flex justify-content-between align-items-center">
								<strong>{topic.name}</strong>
								<Badge bg="warning">control</Badge>
							</Card.Header>
							<Card.Body>
								<div className="mb-3">
									<small className="text-muted d-block">Topic:</small>
									<code
										className="user-select-all cursor-pointer text-break"
										onClick={() => copyToClipboard(topic.topic, topic.topic)}
										title="Click to copy"
									>
										{topic.topic}
									</code>
									{copiedTopic === topic.topic && (
										<small className="text-success d-block mt-1">✓ Copied!</small>
									)}
								</div>

								<p className="small text-muted mb-3">{topic.description}</p>

								<h6>Command Examples:</h6>
								{topic.examples.map((example, exampleIndex) => (
									<div key={exampleIndex} className="mb-3 p-2 bg-light rounded">
										<div className="d-flex justify-content-between align-items-start mb-2">
											<small className="text-muted">{example.description}</small>
											<Button
												size="sm"
												variant="outline-primary"
												onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${topic.topic}_${exampleIndex}`)}
											>
												{copiedTopic === `${topic.topic}_${exampleIndex}` ? '✓' : 'Copy'}
											</Button>
										</div>
										<pre className="small mb-0 text-wrap">
											<code>{formatValue(example.value, topic.dataType)}</code>
										</pre>
									</div>
								))}
							</Card.Body>
						</Card>
					</Col>
				))}
			</Row>

			{/* Quick Test Section */}
			<Card className="mt-5">
				<Card.Header>
					<h5 className="mb-0">🧪 Quick Test Commands</h5>
				</Card.Header>
				<Card.Body>
					<p>Use these commands with mosquitto_pub to test the system:</p>

					<div className="mb-3">
						<h6>Test Sensor Data:</h6>
						<div className="bg-dark text-light p-3 rounded">
							<code>
								{`# Send temperature data
mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "25.5"

# Send humidity data  
mosquitto_pub -h localhost -t "greenhouse/sensors/humidity" -m "65.0"

# Send soil moisture
mosquitto_pub -h localhost -t "greenhouse/sensors/soil" -m "45.3"`}
							</code>
						</div>
					</div>

					<div className="mb-3">
						<h6>Test Device Control:</h6>
						<div className="bg-dark text-light p-3 rounded">
							<code>
								{`# Turn on lights
mosquitto_pub -h localhost -t "greenhouse/devices/light/control" -m '{"action":"turn_on","value":100,"timestamp":"2025-07-15T10:30:00Z"}'

# Start watering
mosquitto_pub -h localhost -t "greenhouse/devices/pump/control" -m '{"action":"start_watering","value":30,"timestamp":"2025-07-15T08:00:00Z"}'`}
							</code>
						</div>
					</div>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default MQTTExamples;
