import React, { useState } from 'react';
import { Card } from 'react-bootstrap';
import { useLineChartData } from '@/hooks/useLineChartData';
import LineChartControls from './LineChartControls';
import LineChartVisualization from './LineChartVisualization';
import LineChartMetrics from './LineChartMetrics';
import './LineChart.css';

interface LineChartProps {
	title?: string;
	className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
	title = "Sensor Data Timeline",
	className = ""
}) => {
	const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
	const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
		'temperature',
		'humidity'
	]);

	const { data, loading, error, fetchData } = useLineChartData();

	const handleTimeRangeChange = (range: '1h' | '24h' | '7d' | '30d') => {
		setTimeRange(range);
		fetchData(range);
	};

	const handleRefresh = () => {
		fetchData(timeRange);
	};

	const handleMetricToggle = (metric: string) => {
		setSelectedMetrics(prev =>
			prev.includes(metric)
				? prev.filter(m => m !== metric)
				: [...prev, metric]
		);
	};

	return (
		<Card className={`line-chart-card ${className}`}>
			<Card.Header className="d-flex justify-content-between align-items-center">
				<h5 className="mb-0">{title}</h5>
				<LineChartControls
					timeRange={timeRange}
					loading={loading}
					error={error}
					onTimeRangeChange={handleTimeRangeChange}
					onRefresh={handleRefresh}
				/>
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
