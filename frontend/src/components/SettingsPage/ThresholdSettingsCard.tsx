import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import UnsavedChangesWarning from '@/components/Common/UnsavedChangesWarning';

interface ThresholdSettings {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { trigger: number }; // Binary sensor: 0 = alert when dry, 1 = alert when wet
	waterLevelThreshold: { trigger: number }; // Binary sensor: 0 = alert when empty, 1 = alert when full
}

interface ThresholdSettingsCardProps {
	thresholds: ThresholdSettings;
	onThresholdChange: (key: keyof ThresholdSettings, field: 'min' | 'max' | 'trigger', value: number) => void;
	hasUnsavedChanges?: boolean;
}

const ThresholdSettingsCard: React.FC<ThresholdSettingsCardProps> = ({
	thresholds,
	onThresholdChange,
	hasUnsavedChanges = false
}) => {
	return (
		<Card className="mb-4">
			<Card.Header>
				<h5 className="mb-0">📊 Sensor Thresholds</h5>
			</Card.Header>
			<Card.Body>
				<UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} />

				<Row>
					<Col md={6}>
						<h6>🌡️ Temperature (°C)</h6>
						<Row>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Min:</Form.Label>
									<Form.Control
										type="number"
										value={thresholds.temperatureThreshold.min}
										onChange={(e) => onThresholdChange('temperatureThreshold', 'min', parseFloat(e.target.value))}
									/>
								</Form.Group>
							</Col>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Max:</Form.Label>
									<Form.Control
										type="number"
										value={thresholds.temperatureThreshold.max}
										onChange={(e) => onThresholdChange('temperatureThreshold', 'max', parseFloat(e.target.value))}
									/>
								</Form.Group>
							</Col>
						</Row>
					</Col>

					<Col md={6}>
						<h6>💧 Humidity (%)</h6>
						<Row>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Min:</Form.Label>
									<Form.Control
										type="number"
										value={thresholds.humidityThreshold.min}
										onChange={(e) => onThresholdChange('humidityThreshold', 'min', parseFloat(e.target.value))}
									/>
								</Form.Group>
							</Col>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Max:</Form.Label>
									<Form.Control
										type="number"
										value={thresholds.humidityThreshold.max}
										onChange={(e) => onThresholdChange('humidityThreshold', 'max', parseFloat(e.target.value))}
									/>
								</Form.Group>
							</Col>
						</Row>
					</Col>
				</Row>

				<Row>
					<Col md={6}>
						<h6>🌱 Soil Moisture (Binary)</h6>
						<Form.Group className="mb-3">
							<Form.Label>Alert Trigger Value:</Form.Label>
							<Form.Select
								value={thresholds.soilMoistureThreshold.trigger}
								onChange={(e) => onThresholdChange('soilMoistureThreshold', 'trigger', parseFloat(e.target.value))}
							>
								<option value={0}>0 - Alert when Dry (Default)</option>
								<option value={1}>1 - Alert when Wet</option>
							</Form.Select>
							<Form.Text className="text-muted">
								Binary sensor: Choose when to trigger alerts (0 = dry soil, 1 = wet soil)
							</Form.Text>
						</Form.Group>
					</Col>

					<Col md={6}>
						<h6>🚰 Water Level (Binary)</h6>
						<Form.Group className="mb-3">
							<Form.Label>Alert Trigger Value:</Form.Label>
							<Form.Select
								value={thresholds.waterLevelThreshold.trigger}
								onChange={(e) => onThresholdChange('waterLevelThreshold', 'trigger', parseFloat(e.target.value))}
							>
								<option value={0}>0 - Alert when Empty (Default)</option>
								<option value={1}>1 - Alert when Full</option>
							</Form.Select>
							<Form.Text className="text-muted">
								Binary sensor: Choose when to trigger alerts (0 = empty tank, 1 = full tank)
							</Form.Text>
						</Form.Group>
					</Col>
				</Row>
			</Card.Body>
		</Card>
	);
};

export default ThresholdSettingsCard;
