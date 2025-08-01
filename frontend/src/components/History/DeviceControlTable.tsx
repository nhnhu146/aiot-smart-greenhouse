import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { DeviceControl } from '@/services/mockDataService';
import { SortState } from '@/types/history';

interface DeviceControlTableProps {
	data: DeviceControl[];
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice') => void;
}

const DeviceControlTable: React.FC<DeviceControlTableProps> = ({ data, sortState, onSort }) => {
	const getSortIcon = (field: string, tab: 'sensors' | 'controls' | 'voice') => {
		if (sortState.field === field && sortState.tab === tab) {
			return sortState.direction === 'asc' ? ' ↑' : ' ↓';
		}
		return ' ↕';
	};

	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);
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

	const getDeviceIcon = (deviceType: string) => {
		switch (deviceType) {
			case 'light': return '💡';
			case 'pump': return '🔧';
			case 'door': return '🚪';
			case 'window': return '🪟';
			default: return '🎮';
		}
	};

	const getActionBadge = (action: string) => {
		switch (action) {
			case 'on':
			case 'open':
				return 'success';
			case 'off':
			case 'close':
				return 'secondary';
			default:
				return 'info';
		}
	};

	return (
		<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
			<Table striped hover>
				<thead className="table-light sticky-top">
					<tr>
						<th className="sortable-header" onClick={() => onSort('timestamp', 'controls')}>
							Time{getSortIcon('timestamp', 'controls')}
						</th>
						<th className="sortable-header" onClick={() => onSort('deviceType', 'controls')}>
							Device{getSortIcon('deviceType', 'controls')}
						</th>
						<th className="sortable-header" onClick={() => onSort('action', 'controls')}>
							Action{getSortIcon('action', 'controls')}
						</th>
						<th className="sortable-header" onClick={() => onSort('status', 'controls')}>
							Status{getSortIcon('status', 'controls')}
						</th>
						<th className="sortable-header" onClick={() => onSort('controlType', 'controls')}>
							Control Type{getSortIcon('controlType', 'controls')}
						</th>
						<th className="sortable-header" onClick={() => onSort('triggeredBy', 'controls')}>
							Triggered By{getSortIcon('triggeredBy', 'controls')}
						</th>
						<th className="sortable-header" onClick={() => onSort('success', 'controls')}>
							Success{getSortIcon('success', 'controls')}
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item, index) => (
						<tr key={index}>
							<td className="text-nowrap">{formatDateTime(item.timestamp)}</td>
							<td>
								{getDeviceIcon(item.deviceType)} {item.deviceType}
							</td>
							<td>
								<Badge bg={getActionBadge(item.action)}>
									{item.action.toUpperCase()}
								</Badge>
							</td>
							<td>
								<Badge bg={item.status ? 'success' : 'secondary'}>
									{item.status ? 'ON' : 'OFF'}
								</Badge>
							</td>
							<td>
								<Badge bg={item.controlType === 'auto' ? 'info' : 'warning'}>
									{item.controlType.toUpperCase()}
								</Badge>
							</td>
							<td>{item.triggeredBy || item.userId || 'System'}</td>
							<td>
								<Badge bg={item.success ? 'success' : 'danger'}>
									{item.success ? '✓ Success' : '✗ Failed'}
								</Badge>
							</td>
						</tr>
					))}
				</tbody>
			</Table>
		</div>
	);
};

export default DeviceControlTable;
