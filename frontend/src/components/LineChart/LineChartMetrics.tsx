import React from 'react';
import { Form, Badge } from 'react-bootstrap';

interface SensorData {
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
}

interface LineChartMetricsProps {
	selectedMetrics: string[];
	onMetricToggle: (metric: string) => void;
	data: SensorData[];
}

const LineChartMetrics: React.FC<LineChartMetricsProps> = ({
	selectedMetrics,
	onMetricToggle,
	data
}) => {
	const metrics = [
		{ key: 'temperature', label: 'Temperature', color: '#ff6b6b', unit: '°C' },
		{ key: 'humidity', label: 'Humidity', color: '#4dabf7', unit: '%' },
		{ key: 'soilMoisture', label: 'Soil Moisture', color: '#69db7c', unit: '' },
		{ key: 'waterLevel', label: 'Water Level', color: '#51cf66', unit: '' },
		{ key: 'lightLevel', label: 'Light Level', color: '#ffd43b', unit: '' },
	];

	const getLatestValue = (metric: string): number | null => {
		if (!data || data.length === 0) return null;
		const latest = data[data.length - 1];
		return latest?.[metric as keyof SensorData] || null;
	};

	return (
		<div className="chart-metrics mb-3">
			<div className="d-flex flex-wrap gap-3">
				{metrics.map(metric => {
					const isSelected = selectedMetrics.includes(metric.key);
					const latestValue = getLatestValue(metric.key);

					return (
						<Form.Check
							key={metric.key}
							type="checkbox"
							id={`metric-${metric.key}`}
							checked={isSelected}
							onChange={() => onMetricToggle(metric.key)}
							className="metric-checkbox"
							label={
								<div className="d-flex align-items-center">
									<div
										className="metric-color-indicator me-2"
										style={{
											width: '12px',
											height: '12px',
											borderRadius: '50%',
											backgroundColor: metric.color,
											opacity: isSelected ? 1 : 0.3
										}}
									/>
									<span className={isSelected ? 'fw-medium' : 'text-muted'}>
										{metric.label}
									</span>
									{latestValue !== null && (
										<Badge
											bg="light"
											text="dark"
											className="ms-2"
											style={{ fontSize: '0.75rem' }}
										>
											{latestValue.toFixed(1)}{metric.unit}
										</Badge>
									)}
								</div>
							}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default LineChartMetrics;
