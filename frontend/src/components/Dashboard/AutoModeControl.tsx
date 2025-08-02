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
		<Card className="control-card">
			<Card.Header className="d-flex justify-content-between align-items-center">
				<h6 className="mb-0">🤖 Automation Control</h6>
				<Form.Check
					type="switch"
					id="auto-mode-switch"
					checked={autoMode}
					onChange={onToggle}
					className={autoMode ? 'text-success' : 'text-warning'}
				/>
			</Card.Header>
			<Card.Body>
				<div className="d-flex gap-3 align-items-center mb-3">
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
