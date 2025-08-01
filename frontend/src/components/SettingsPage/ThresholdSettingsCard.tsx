import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface ThresholdSettings {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { min: number; max: number };
	waterLevelThreshold: { min: number; max: number };
}

interface ThresholdSettingsCardProps {
	thresholds: ThresholdSettings;
	onThresholdChange: (key: keyof ThresholdSettings, field: 'min' | 'max', value: number) => void;
}

const ThresholdSettingsCard: React.FC<ThresholdSettingsCardProps> = ({ thresholds, onThresholdChange }) => {
	return (
		<Card className="mb-4">
			<Card.Header>
				<h5 className="mb-0">📊 Sensor Thresholds</h5>
			</Card.Header>
			<Card.Body>
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
						<Form.Text className="text-muted">
							Binary sensor: 0 = Dry, 1 = Wet
						</Form.Text>
					</Col>

					<Col md={6}>
						<h6>🚰 Water Level (Binary)</h6>
						<Form.Text className="text-muted">
							Binary sensor: 0 = Low, 1 = Full
						</Form.Text>
					</Col>
				</Row>
			</Card.Body>
		</Card>
	);
};

export default ThresholdSettingsCard;
