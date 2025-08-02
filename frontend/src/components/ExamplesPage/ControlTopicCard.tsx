import React from 'react';
import { Col, Card, Button } from 'react-bootstrap';

interface ControlTopicCardProps {
	topic: any;
	index: number;
	copiedItem: string | null;
	copyToClipboard: (text: string, itemId: string) => void;
	getValueForMQTT: (value: any, dataType: string) => string;
}

const ControlTopicCard: React.FC<ControlTopicCardProps> = ({
	topic,
	index,
	copiedItem,
	copyToClipboard
}) => {
	return (
		<Col key={index} md={6} lg={4} className="mb-4">
			<Card className="h-100 border-success">
				<Card.Header className="bg-success text-dark">
					<h6 className="mb-0" style={{ color: '#2b512b', fontWeight: '600' }}>{topic.name}</h6>
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
								onClick={() => copyToClipboard(topic.topic, `control_topic_${index}`)}
							>
								{copiedItem === `control_topic_${index}` ? '✓' : 'Copy'}
							</Button>
						</div>
					</div>

					<h6>Commands:</h6>
					{topic.examples.map((example: any, exampleIndex: number) => (
						<div key={exampleIndex} className="mb-2 p-2 bg-light rounded">
							<div className="d-flex justify-content-between align-items-start">
								<div>
									<small className="text-muted d-block">{example.description}</small>
									<code>{example.command}</code>
								</div>
								<Button
									size="sm"
									variant="outline-success"
									onClick={() => copyToClipboard(example.command, `${topic.topic}_cmd_${exampleIndex}`)}
								>
									{copiedItem === `${topic.topic}_cmd_${exampleIndex}` ? '✓' : 'Copy'}
								</Button>
							</div>
						</div>
					))}
				</Card.Body>
			</Card>
		</Col>
	);
};

export default ControlTopicCard;
