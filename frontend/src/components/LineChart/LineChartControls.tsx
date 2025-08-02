import React from 'react';
import { Spinner, Alert, Button } from 'react-bootstrap';

interface LineChartControlsProps {
	timeRange: '1h' | '24h' | '7d' | '30d';
	loading: boolean;
	error: string | null;
	onTimeRangeChange: (range: '1h' | '24h' | '7d' | '30d') => void;
	onRefresh: () => void;
}

const LineChartControls: React.FC<LineChartControlsProps> = ({
	timeRange,
	loading,
	error,
	onTimeRangeChange,
	onRefresh
}) => {
	const timeRangeOptions = [
		{ value: '1h', label: '1 Hour' },
		{ value: '24h', label: '24 Hours' },
		{ value: '7d', label: '7 Days' },
		{ value: '30d', label: '30 Days' },
	] as const;

	return (
		<div className="chart-controls">
			<div className="time-range-buttons">
				{timeRangeOptions.map(option => (
					<Button
						key={option.value}
						variant={timeRange === option.value ? "primary" : "outline-primary"}
						size="sm"
						onClick={() => onTimeRangeChange(option.value)}
						disabled={loading}
						className="me-2"
					>
						{option.label}
					</Button>
				))}
			</div>

			<Button
				variant="outline-secondary"
				size="sm"
				onClick={onRefresh}
				disabled={loading}
			>
				{loading ? (
					<>
						<Spinner size="sm" className="me-1" />
						Refreshing...
					</>
				) : (
					'🔄 Refresh'
				)}
			</Button>

			{error && (
				<Alert variant="warning" className="mt-2 mb-0">
					<small>⚠️ {error}</small>
				</Alert>
			)}
		</div>
	);
};

export default LineChartControls;
