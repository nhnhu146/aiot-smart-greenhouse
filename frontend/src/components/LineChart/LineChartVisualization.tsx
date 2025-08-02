import React from 'react';
import { Line } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale,
} from 'chart.js';
import { ChartUtils } from '@/utils/chart/ChartUtils';
import 'chartjs-adapter-date-fns';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale
);

interface SensorData {
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
	timestamp?: string;
	createdAt?: string;
}

interface LineChartVisualizationProps {
	data: SensorData[];
	loading: boolean;
	selectedMetrics: string[];
}

const LineChartVisualization: React.FC<LineChartVisualizationProps> = ({
	data,
	loading,
	selectedMetrics
}) => {
	const formatChartData = () => {
		if (!data || data.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		// Use ChartUtils to clean and validate data
		const validData = ChartUtils.filterValidData(data.map(item => ({
			...item,
			timestamp: item.createdAt || item.timestamp || new Date().toISOString()
		})));

		if (validData.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		// Format data using ChartUtils
		return ChartUtils.formatForChart(validData, selectedMetrics);
	};

	const options = ChartUtils.getChartOptions();

	if (loading) {
		return (
			<div className="chart-loading">
				<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
					<div className="spinner-border text-primary me-2" role="status">
						<span className="sr-only">Loading chart...</span>
					</div>
					<span>Loading chart data...</span>
				</div>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="chart-empty">
				<div className="d-flex justify-content-center align-items-center flex-column" style={{ height: '300px' }}>
					<div className="text-muted mb-2" style={{ fontSize: '3rem' }}>📊</div>
					<h5 className="text-muted">No Data Available</h5>
					<p className="text-muted">Try selecting a different time range or check your connection.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="chart-container" style={{ height: '400px' }}>
			<Line data={formatChartData()} options={options} />
		</div>
	);
};

export default LineChartVisualization;
