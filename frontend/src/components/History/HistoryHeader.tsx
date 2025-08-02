import React from 'react';
import { Button } from 'react-bootstrap';

interface HistoryHeaderProps {
	onToggleFilters: () => void;
	onExportData: (format: 'json' | 'csv') => void;
	isExporting: boolean;
	hasActiveFilters: boolean;
}

const HistoryHeader: React.FC<HistoryHeaderProps> = ({
	onToggleFilters,
	onExportData,
	isExporting,
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
					disabled={isExporting}
					className="me-2"
				>
					{isExporting ? "📤 Exporting..." : "📤 Export JSON"}
				</Button>

				<Button
					variant="outline-info"
					onClick={() => onExportData('csv')}
					disabled={isExporting}
				>
					{isExporting ? "📤 Exporting..." : "📤 Export CSV"}
				</Button>
			</div>
		</div>
	);
};
export default HistoryHeader;
