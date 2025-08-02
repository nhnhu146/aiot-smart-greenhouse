import { useState } from 'react';
import { Container, Row, Tab, Tabs, Card, Badge, Button, Alert } from 'react-bootstrap';
import SensorTopicCard from '@/components/ExamplesPage/SensorTopicCard';
import ControlTopicCard from '@/components/ExamplesPage/ControlTopicCard';
import { sensorTopics, controlTopics, apiEndpoints, websocketEvents } from '@/components/ExamplesPage/topicsData';
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
						{sensorTopics.map((topic, index) => (
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
						{controlTopics.map((topic, index) => (
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
						{apiEndpoints.map((group, groupIndex) => (
							<Card key={groupIndex} className="mb-4">
								<Card.Header>
									<h5 className="mb-0">{group.title}</h5>
								</Card.Header>
								<Card.Body>
									{group.endpoints.map((endpoint, endpointIndex) => (
										<div key={endpointIndex} className="mb-3 p-3 bg-light rounded">
											<div className="d-flex justify-content-between align-items-start mb-2">
												<div>
													<Badge bg={endpoint.method === 'GET' ? 'primary' : 'success'} className="me-2">
														{endpoint.method}
													</Badge>
													<code>{endpoint.path}</code>
												</div>
												<Button
													size="sm"
													variant="outline-secondary"
													onClick={() => copyToClipboard(endpoint.path, `api_${groupIndex}_${endpointIndex}`)}
												>
													{copiedItem === `api_${groupIndex}_${endpointIndex}` ? '✓' : 'Copy'}
												</Button>
											</div>
											<p className="text-muted mb-2">{endpoint.description}</p>
											<pre className="bg-dark text-light p-2 rounded">
												<code>{JSON.stringify(endpoint.example, null, 2)}</code>
											</pre>
										</div>
									))}
								</Card.Body>
							</Card>
						))}
					</div>
				</Tab>

				<Tab eventKey="websocket" title="⚡ WebSocket">
					<div className="mt-4">
						{websocketEvents.map((group, groupIndex) => (
							<Card key={groupIndex} className="mb-4">
								<Card.Header>
									<h5 className="mb-0">{group.title}</h5>
								</Card.Header>
								<Card.Body>
									{group.events.map((event, eventIndex) => (
										<div key={eventIndex} className="mb-3 p-3 bg-light rounded">
											<div className="d-flex justify-content-between align-items-start mb-2">
												<div>
													<Badge bg="info" className="me-2">EVENT</Badge>
													<code>{event.event}</code>
												</div>
												<Button
													size="sm"
													variant="outline-secondary"
													onClick={() => copyToClipboard(event.event, `ws_${groupIndex}_${eventIndex}`)}
												>
													{copiedItem === `ws_${groupIndex}_${eventIndex}` ? '✓' : 'Copy'}
												</Button>
											</div>
											<p className="text-muted mb-2">{event.description}</p>
											<pre className="bg-dark text-light p-2 rounded">
												<code>{JSON.stringify(event.example, null, 2)}</code>
											</pre>
										</div>
									))}
								</Card.Body>
							</Card>
						))}

						<Alert variant="info" className="mt-4">
							<strong>WebSocket Connection:</strong> Connect to <code>ws://localhost:3001</code> for real-time updates.
							The server broadcasts sensor data, device status changes, and voice command events automatically.
						</Alert>
					</div>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default ExamplesPage;
