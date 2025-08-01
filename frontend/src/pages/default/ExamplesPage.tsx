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
					<div className="text-center py-5">
						<h5>REST API Documentation</h5>
						<p className="text-muted">
							API endpoints documentation can be found in the backend README.md
						</p>
					</div>
				</Tab>

				<Tab eventKey="websocket" title="⚡ WebSocket">
					<div className="text-center py-5">
						<h5>WebSocket Events</h5>
						<p className="text-muted">
							Real-time sensor data and device status updates via WebSocket connection.
						</p>
					</div>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default ExamplesPage;
