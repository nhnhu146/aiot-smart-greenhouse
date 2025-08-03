import React from 'react';
import { Button } from 'react-bootstrap';

interface HistoryHeaderProps {
	onToggleFilters: () => void;
	onExportData: (format: 'json' | 'csv') => void;
	hasActiveFilters: boolean;
}

const HistoryHeader: React.FC<HistoryHeaderProps> = ({
	onToggleFilters,
	onExportData,
	hasActiveFilters
}) => {
	return (
		<div className="history-header">
			<h1 className="history-title">📊 Data History</h1>

			<div className="filter-controls">
				<Button
					variant={hasActiveFilters ? "warning" : "outline-primary"}
					onClick={onToggleFilters}
					className="me-2"
				>
					{hasActiveFilters ? "🔍 Filters (Active)" : "🔍 Filters"}
				</Button>

				<Button
					variant="outline-success"
					onClick={() => onExportData('json')}
					className="me-2"
				>
					📤 Export JSON
				</Button>

				<Button
					variant="outline-info"
					onClick={() => onExportData('csv')}
				>
					📤 Export CSV
				</Button>
			</div>
		</div>
	);
};
export default HistoryHeader;
