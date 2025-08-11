import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
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

	const { data, loading, fetchData } = useLineChartData();

	const handleMetricToggle = (metric: string) => {
		setSelectedMetrics(prev =>
			prev.includes(metric)
				? prev.filter(m => m !== metric)
				: [...prev, metric]
		);
	};

	const handleRefresh = () => {
		console.log('🔄 Manual refresh triggered for LineChart');
		fetchData();
	};

	return (
		<Card className={`line-chart-card ${className}`}>
			<Card.Header className="d-flex justify-content-between align-items-center">
				<h5 className="mb-0">📊 Sensor Data Timeline</h5>
				<Button
					variant="outline-light"
					size="sm"
					onClick={handleRefresh}
					disabled={loading}
				>
					{loading ? '🔄' : '🔄 Refresh'}
				</Button>
			</Card.Header>
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
