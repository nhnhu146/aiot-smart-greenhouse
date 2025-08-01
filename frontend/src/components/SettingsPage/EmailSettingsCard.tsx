import React from 'react';
import { Card, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';

interface EmailAlertsConfig {
	temperature: boolean;
	humidity: boolean;
	soilMoisture: boolean;
	waterLevel: boolean;
}

interface EmailSettingsCardProps {
	emailRecipients: string[];
	emailAlerts: EmailAlertsConfig;
	alertFrequency: number;
	batchAlerts: boolean;
	newEmail: string;
	emailError: string;
	onEmailRecipientsChange: (recipients: string[]) => void;
	onEmailAlertsChange: (alerts: EmailAlertsConfig) => void;
	onAlertFrequencyChange: (frequency: number) => void;
	onBatchAlertsChange: (batch: boolean) => void;
	onNewEmailChange: (email: string) => void;
	onEmailErrorChange: (error: string) => void;
}

const EmailSettingsCard: React.FC<EmailSettingsCardProps> = ({
	emailRecipients,
	emailAlerts,
	alertFrequency,
	batchAlerts,
	newEmail,
	emailError,
	onEmailRecipientsChange,
	onEmailAlertsChange,
	onAlertFrequencyChange,
	onBatchAlertsChange,
	onNewEmailChange,
	onEmailErrorChange
}) => {
	const addEmailRecipient = () => {
		const email = newEmail.trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			onEmailErrorChange('Please enter an email address');
			return;
		}

		if (!emailRegex.test(email)) {
			onEmailErrorChange('Please enter a valid email address');
			return;
		}

		if (emailRecipients.includes(email)) {
			onEmailErrorChange('This email is already in the list');
			return;
		}

		onEmailRecipientsChange([...emailRecipients, email]);
		onNewEmailChange('');
		onEmailErrorChange('');
	};

	const removeEmailRecipient = (emailToRemove: string) => {
		onEmailRecipientsChange(emailRecipients.filter(email => email !== emailToRemove));
	};

	return (
		<Card className="mb-4">
			<Card.Header>
				<h5 className="mb-0">📧 Email Alert Settings</h5>
			</Card.Header>
			<Card.Body>
				<Form.Group className="mb-3">
					<Form.Label>Alert Types</Form.Label>
					<Row>
						<Col md={6}>
							<Form.Check
								type="checkbox"
								label="🌡️ Temperature Alerts"
								checked={emailAlerts.temperature}
								onChange={(e) => onEmailAlertsChange({ ...emailAlerts, temperature: e.target.checked })}
							/>
							<Form.Check
								type="checkbox"
								label="💧 Humidity Alerts"
								checked={emailAlerts.humidity}
								onChange={(e) => onEmailAlertsChange({ ...emailAlerts, humidity: e.target.checked })}
							/>
						</Col>
						<Col md={6}>
							<Form.Check
								type="checkbox"
								label="🌱 Soil Moisture Alerts"
								checked={emailAlerts.soilMoisture}
								onChange={(e) => onEmailAlertsChange({ ...emailAlerts, soilMoisture: e.target.checked })}
							/>
							<Form.Check
								type="checkbox"
								label="🚰 Water Level Alerts"
								checked={emailAlerts.waterLevel}
								onChange={(e) => onEmailAlertsChange({ ...emailAlerts, waterLevel: e.target.checked })}
							/>
						</Col>
					</Row>
				</Form.Group>

				<Row>
					<Col md={6}>
						<Form.Group className="mb-3">
							<Form.Label>Alert Frequency (minutes)</Form.Label>
							<Form.Control
								type="number"
								min="1"
								max="60"
								value={alertFrequency}
								onChange={(e) => onAlertFrequencyChange(parseInt(e.target.value))}
							/>
							<Form.Text className="text-muted">
								Minimum time between alerts for the same sensor
							</Form.Text>
						</Form.Group>
					</Col>
					<Col md={6}>
						<Form.Group className="mb-3">
							<Form.Label>Batch Alerts</Form.Label>
							<Form.Check
								type="switch"
								label={batchAlerts ? "Enabled - Group multiple alerts" : "Disabled - Send individual alerts"}
								checked={batchAlerts}
								onChange={(e) => onBatchAlertsChange(e.target.checked)}
							/>
						</Form.Group>
					</Col>
				</Row>

				<Form.Group className="mb-3">
					<Form.Label>Email Recipients</Form.Label>
					<div className="d-flex gap-2 mb-2">
						<Form.Control
							type="email"
							placeholder="Enter email address"
							value={newEmail}
							onChange={(e) => onNewEmailChange(e.target.value)}
							isInvalid={!!emailError}
						/>
						<Button onClick={addEmailRecipient} variant="outline-primary">
							Add
						</Button>
					</div>
					{emailError && <Alert variant="danger">{emailError}</Alert>}

					<div className="d-flex flex-wrap gap-2">
						{emailRecipients.map((email, index) => (
							<Badge key={index} bg="secondary" className="d-flex align-items-center">
								{email}
								<Button
									variant="link"
									size="sm"
									className="text-white p-0 ms-1"
									onClick={() => removeEmailRecipient(email)}
								>
									×
								</Button>
							</Badge>
						))}
					</div>
				</Form.Group>
			</Card.Body>
		</Card>
	);
};

export default EmailSettingsCard;
