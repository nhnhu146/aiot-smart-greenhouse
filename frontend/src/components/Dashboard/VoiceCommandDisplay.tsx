import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { VoiceCommand } from '@/hooks/useVoiceCommands';

interface VoiceCommandDisplayProps {
	latestVoiceCommand: VoiceCommand | null;
	formatDateTime: (timestamp: string) => string;
}

const VoiceCommandDisplay: React.FC<VoiceCommandDisplayProps> = ({
	latestVoiceCommand,
	formatDateTime
}) => {
	// if (!latestVoiceCommand) {
	// 	return null;
	// }
	if (!latestVoiceCommand) {
		return (
			<Card className="control-card h-100">
				<Card.Header>
					<h6 className="mb-0">🎤 Latest Voice Command</h6>
				</Card.Header>
				<Card.Body className="d-flex flex-column justify-content-center">
					<div className="text-muted">No voice commands recorded yet.</div>
				</Card.Body>
			</Card>
		);
	}
	return (
		<Card className="control-card h-100">
			<Card.Header>
				<h6 className="mb-0">🎤 Latest Voice Command</h6>
			</Card.Header>
			<Card.Body className="d-flex flex-column justify-content-center">
				<div className="d-flex flex-column gap-2">
					<div>
						<strong>Command:</strong> {latestVoiceCommand.command}
					</div>
					<div>
						<strong>Confidence:</strong>{' '}
						{latestVoiceCommand.confidence !== null
							? `${(latestVoiceCommand.confidence * 100).toFixed(1)}%`
							: 'N/A'}
					</div>
					<div>
						<strong>Time:</strong> {formatDateTime(latestVoiceCommand.timestamp)}
					</div>
					<div>
						<Badge bg={latestVoiceCommand.processed ? 'success' : 'warning'}>
							{latestVoiceCommand.processed ? 'Processed' : 'Processing...'}
						</Badge>
					</div>
					{latestVoiceCommand.errorMessage && (
						<div className="text-danger">
							<strong>Error:</strong> {latestVoiceCommand.errorMessage}
						</div>
					)}
				</div>
			</Card.Body>
		</Card>
	);
};

export default VoiceCommandDisplay;
