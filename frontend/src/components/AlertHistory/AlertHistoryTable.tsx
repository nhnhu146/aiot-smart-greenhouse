import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { AlertHistoryItem } from '@/hooks/useAlertHistory';
import { SortState } from '@/types/history';
import SortableHeader from '../History/SortableHeader';
import '@/styles/HistoryTable.css';

interface AlertHistoryTableProps {
	data: AlertHistoryItem[];
	onAcknowledge: (alertId: string) => Promise<void>;
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice' | 'alerts') => void;
}

const AlertHistoryTable: React.FC<AlertHistoryTableProps> = ({
	data,
	onAcknowledge,
	sortState,
	onSort
}) => {
	const getSeverityVariant = (level: string) => {
		switch (level) {
			case 'critical': return 'danger';
			case 'high': return 'warning';
			case 'medium': return 'info';
			case 'low': return 'secondary';
			default: return 'secondary';
		}
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'temperature': return '🌡️';
			case 'humidity': return '💧';
			case 'soilMoisture': return '🌱';
			case 'waterLevel': return '🚰';
			case 'device': return '⚙️';
			case 'system': return '🖥️';
			default: return '⚠️';
		}
	};

	const formatTimestamp = (timestamp: string): string => {
		if (!timestamp) return 'N/A';
		
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) {
			return timestamp; // Return original string if date is invalid
		}
		
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
			timeZone: 'Asia/Ho_Chi_Minh'
		});
	};

	const handleAcknowledge = async (alertId: string) => {
		try {
			await onAcknowledge(alertId);
		} catch (error) {
			console.error('Failed to acknowledge alert:', error);
		}
	};

	// Remove getSortIcon as SortableHeader handles it

	if (data.length === 0) {
		return (
			<div className="text-center py-4 text-muted">
				<h5>No alerts found</h5>
				<p>Try adjusting your filters or check back later.</p>
			</div>
		);
	}

	return (
		<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
			<Table striped hover className="history-table">
				<thead className="table-light sticky-top">
					<tr>
						<SortableHeader field="createdAt" tab="alerts" sortState={sortState} onSort={onSort}>
							Time
						</SortableHeader>
						<SortableHeader field="type" tab="alerts" sortState={sortState} onSort={onSort}>
							Type
						</SortableHeader>
						<SortableHeader field="level" tab="alerts" sortState={sortState} onSort={onSort}>
							Severity
						</SortableHeader>
						<th>Message</th>
						<SortableHeader field="value" tab="alerts" sortState={sortState} onSort={onSort}>
							Value
						</SortableHeader>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{data.map((alert) => (
						<tr key={alert._id} className={alert.acknowledged ? 'table-light' : ''}>
							<td className="text-nowrap">
								{formatTimestamp(alert.createdAt)}
							</td>
							<td>
								<span className="me-1">{getTypeIcon(alert.type)}</span>
								{alert.type}
							</td>
							<td>
								<Badge bg={getSeverityVariant(alert.level)}>
									{alert.level.toUpperCase()}
								</Badge>
							</td>
							<td>
								<small>{alert.message}</small>
							</td>
							<td>
								{alert.value !== undefined && alert.value !== null ? (
									<code>{alert.value}</code>
								) : (
									<span className="text-muted">-</span>
								)}
							</td>
							<td>
								{alert.acknowledged ? (
									<Badge bg="success">
										✓ Acknowledged
									</Badge>
								) : (
									<Badge bg="secondary">
										⏳ Pending
									</Badge>
								)}
							</td>
							<td>
								{!alert.acknowledged && (
									<Button
										size="sm"
										variant="outline-success"
										onClick={() => handleAcknowledge(alert._id)}
									>
										Acknowledge
									</Button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</Table>
		</div>
	);
};

export default AlertHistoryTable;
