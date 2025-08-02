import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { AlertHistoryItem } from '@/hooks/useAlertHistory';

interface AlertHistoryTableProps {
	data: AlertHistoryItem[];
	onAcknowledge: (alertId: string) => Promise<void>;
	sortState: { field: string; direction: 'asc' | 'desc' };
	onSort: (field: string) => void;
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

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	};

	const handleAcknowledge = async (alertId: string) => {
		try {
			await onAcknowledge(alertId);
		} catch (error) {
			console.error('Error acknowledging alert:', error);
		}
	};

	const getSortIcon = (field: string) => {
		if (sortState.field !== field) return '↕️';
		return sortState.direction === 'asc' ? '↑' : '↓';
	};

	if (data.length === 0) {
		return (
			<div className="text-center py-4 text-muted">
				<h5>No alerts found</h5>
				<p>Try adjusting your filters or check back later.</p>
			</div>
		);
	}

	return (
		<div className="table-responsive">
			<Table striped hover className="mb-0">
				<thead className="table-dark">
					<tr>
						<th
							style={{ cursor: 'pointer' }}
							onClick={() => onSort('timestamp')}
						>
							Time {getSortIcon('timestamp')}
						</th>
						<th
							style={{ cursor: 'pointer' }}
							onClick={() => onSort('type')}
						>
							Type {getSortIcon('type')}
						</th>
						<th
							style={{ cursor: 'pointer' }}
							onClick={() => onSort('level')}
						>
							Severity {getSortIcon('level')}
						</th>
						<th>Message</th>
						<th
							style={{ cursor: 'pointer' }}
							onClick={() => onSort('value')}
						>
							Value {getSortIcon('value')}
						</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{data.map((alert) => (
						<tr key={alert._id} className={alert.acknowledged ? 'table-light' : ''}>
							<td className="text-nowrap">
								{formatTimestamp(alert.timestamp)}
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
