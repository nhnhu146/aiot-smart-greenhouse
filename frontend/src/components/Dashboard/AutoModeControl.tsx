import React from 'react';
import { Card, Badge, Form } from 'react-bootstrap';

interface AutoModeControlProps {
	autoMode: boolean;
	userInteraction: boolean;
	onToggle: () => void;
}

const AutoModeControl: React.FC<AutoModeControlProps> = ({
	autoMode,
	userInteraction,
	onToggle
}) => {
	return (
		<Card className="control-card h-100">
			<Card.Header className="d-flex justify-content-between align-items-center" style={{ minHeight: '60px' }}>
				<h6 className="mb-0">🤖 Automation Control</h6>
				<Form.Check
					type="switch"
					id="auto-mode-switch"
					checked={autoMode}
					onChange={onToggle}
					className={autoMode ? 'text-success' : 'text-warning'}
				/>
			</Card.Header>
			<Card.Body className="d-flex flex-column justify-content-center" style={{ minHeight: '120px' }}>
				<div className="d-flex gap-3 align-items-center">
					<Badge bg={autoMode ? "success" : "secondary"}>
						Auto Mode: {autoMode ? "ON" : "OFF"}
					</Badge>
					<Badge bg={userInteraction ? "warning" : "info"}>
						User Interaction: {userInteraction ? "Active" : "Inactive"}
					</Badge>
				</div>
			</Card.Body>
		</Card>
	);
};

export default AutoModeControl;
