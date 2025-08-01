import React from 'react';
import { Card, Col, Button, Badge } from 'react-bootstrap';

interface SensorTopicCardProps {
	topic: any;
	index: number;
	copiedItem: string | null;
	copyToClipboard: (text: string, itemId: string) => void;
	getValueForMQTT: (value: any, dataType: string) => string;
}

const SensorTopicCard: React.FC<SensorTopicCardProps> = ({
	topic,
	index,
	copiedItem,
	copyToClipboard,
	getValueForMQTT
}) => {
	return (
		<Col key={index} md={6} lg={4} className="mb-4">
			<Card className="h-100">
				<Card.Header className="d-flex justify-content-between align-items-center">
					<h6 className="mb-0">{topic.name}</h6>
					<Badge bg="primary">{topic.dataType}</Badge>
				</Card.Header>
				<Card.Body>
					<p className="text-muted">{topic.description}</p>
					<div className="mb-3">
						<small className="text-muted">Topic:</small>
						<div className="d-flex justify-content-between align-items-center">
							<code className="text-break">{topic.topic}</code>
							<Button
								size="sm"
								variant="outline-secondary"
								onClick={() => copyToClipboard(topic.topic, `topic_${index}`)}
							>
								{copiedItem === `topic_${index}` ? '✓' : 'Copy'}
							</Button>
						</div>
					</div>

					{topic.unit && (
						<div className="mb-3">
							<small className="text-muted">Unit:</small>
							<Badge bg="secondary">{topic.unit}</Badge>
						</div>
					)}

					<h6>Example Values:</h6>
					{topic.examples.map((example: any, exampleIndex: number) => (
						<div key={exampleIndex} className="mb-2 p-2 bg-light rounded">
							<div className="d-flex justify-content-between align-items-start">
								<div>
									<small className="text-muted d-block">{example.description}</small>
									<code>{getValueForMQTT(example.value, topic.dataType)}</code>
								</div>
								<Button
									size="sm"
									variant="outline-primary"
									onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${topic.topic}_${exampleIndex}`)}
								>
									{copiedItem === `${topic.topic}_${exampleIndex}` ? '✓' : 'Copy'}
								</Button>
							</div>
						</div>
					))}
				</Card.Body>
			</Card>
		</Col>
	);
};

export default SensorTopicCard;
