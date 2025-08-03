import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import UnsavedChangesWarning from '@/components/Common/UnsavedChangesWarning';

interface ThresholdSettings {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { min: number; max: number };
	waterLevelThreshold: { min: number; max: number };
}

interface ThresholdSettingsCardProps {
	thresholds: ThresholdSettings;
	onThresholdChange: (key: keyof ThresholdSettings, field: 'min' | 'max', value: number) => void;
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
						<Row>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Min (Dry Threshold):</Form.Label>
									<Form.Select
										value={thresholds.soilMoistureThreshold.min}
										onChange={(e) => onThresholdChange('soilMoistureThreshold', 'min', parseFloat(e.target.value))}
									>
										<option value={0}>0 - Dry</option>
										<option value={1}>1 - Wet</option>
									</Form.Select>
								</Form.Group>
							</Col>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Max (Wet Threshold):</Form.Label>
									<Form.Select
										value={thresholds.soilMoistureThreshold.max}
										onChange={(e) => onThresholdChange('soilMoistureThreshold', 'max', parseFloat(e.target.value))}
									>
										<option value={0}>0 - Dry</option>
										<option value={1}>1 - Wet</option>
									</Form.Select>
								</Form.Group>
							</Col>
						</Row>
					</Col>

					<Col md={6}>
						<h6>🚰 Water Level (Binary)</h6>
						<Row>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Min (Low Threshold):</Form.Label>
									<Form.Select
										value={thresholds.waterLevelThreshold.min}
										onChange={(e) => onThresholdChange('waterLevelThreshold', 'min', parseFloat(e.target.value))}
									>
										<option value={0}>0 - Low/Empty</option>
										<option value={1}>1 - Full</option>
									</Form.Select>
								</Form.Group>
							</Col>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>Max (Full Threshold):</Form.Label>
									<Form.Select
										value={thresholds.waterLevelThreshold.max}
										onChange={(e) => onThresholdChange('waterLevelThreshold', 'max', parseFloat(e.target.value))}
									>
										<option value={0}>0 - Low/Empty</option>
										<option value={1}>1 - Full</option>
									</Form.Select>
								</Form.Group>
							</Col>
						</Row>
					</Col>
				</Row>
			</Card.Body>
		</Card>
	);
};

export default ThresholdSettingsCard;
