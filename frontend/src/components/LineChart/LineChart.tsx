import React, { useState } from 'react';
import { Card } from 'react-bootstrap';
import { useLineChartData } from '@/hooks/useLineChartData';
import LineChartVisualization from './LineChartVisualization';
import LineChartMetrics from './LineChartMetrics';
import './LineChart.css';

interface LineChartProps {
	title?: string;
	className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
	className = ""
}) => {
	const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
		'temperature',
		'humidity',
		'plantHeight'
	]);

	const { data, loading } = useLineChartData();

	const handleMetricToggle = (metric: string) => {
		setSelectedMetrics(prev =>
			prev.includes(metric)
				? prev.filter(m => m !== metric)
				: [...prev, metric]
		);
	};

	return (
		<Card className={`line-chart-card ${className}`}>
			<Card.Body>
				<LineChartMetrics
					selectedMetrics={selectedMetrics}
					onMetricToggle={handleMetricToggle}
					data={data}
				/>

				<LineChartVisualization
					data={data}
					loading={loading}
					selectedMetrics={selectedMetrics}
				/>
			</Card.Body>
		</Card>
	);
};

export default LineChart;
