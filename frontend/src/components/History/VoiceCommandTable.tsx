import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { SortState } from '@/types/history';

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

interface VoiceCommandTableProps {
	data: VoiceCommand[];
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice') => void;
}

const VoiceCommandTable: React.FC<VoiceCommandTableProps> = ({ data, sortState, onSort }) => {
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

	const getConfidenceBadge = (confidence: number | null | undefined) => {
		if (confidence == null) return "secondary"; // N/A case
		if (confidence >= 0.9) return "success";
		if (confidence >= 0.7) return "warning";
		return "danger";
	};

	const getVoiceStatusBadge = (command: VoiceCommand) => {
		if (command.errorMessage) return "danger";
		if (command.processed) return "success";
		return "secondary";
	};

	const getCommandIcon = (command: string) => {
		const lowerCommand = command.toLowerCase();
		if (lowerCommand.includes('light')) return '💡';
		if (lowerCommand.includes('pump')) return '🔧';
		if (lowerCommand.includes('door')) return '🚪';
		if (lowerCommand.includes('window')) return '🪟';
		if (lowerCommand.includes('temperature')) return '🌡️';
		if (lowerCommand.includes('humidity')) return '💧';
		return '🎤';
	};

	return (
		<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
			<Table striped hover>
				<thead className="table-light sticky-top">
					<tr>
						<th className="sortable-header" onClick={() => onSort('timestamp', 'voice')}>
							Time{getSortIcon('timestamp', 'voice')}
						</th>
						<th className="sortable-header" onClick={() => onSort('command', 'voice')}>
							Command{getSortIcon('command', 'voice')}
						</th>
						<th className="sortable-header" onClick={() => onSort('confidence', 'voice')}>
							Confidence{getSortIcon('confidence', 'voice')}
						</th>
						<th className="sortable-header" onClick={() => onSort('processed', 'voice')}>
							Status{getSortIcon('processed', 'voice')}
						</th>
						<th className="sortable-header" onClick={() => onSort('errorMessage', 'voice')}>
							Error{getSortIcon('errorMessage', 'voice')}
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map((command, index) => (
						<tr key={command.id || index}>
							<td className="text-nowrap">{formatDateTime(command.timestamp)}</td>
							<td>
								<div className="d-flex align-items-center">
									<span className="me-2">{getCommandIcon(command.command)}</span>
									<code className="text-break">{command.command}</code>
								</div>
							</td>
							<td>
								{command.confidence !== null ? (
									<Badge bg={getConfidenceBadge(command.confidence)}>
										{(command.confidence * 100).toFixed(1)}%
									</Badge>
								) : (
									<Badge bg="secondary">N/A</Badge>
								)}
							</td>
							<td>
								<Badge bg={getVoiceStatusBadge(command)}>
									{command.errorMessage ? '❌ Error' :
										command.processed ? '✅ Processed' :
											'⏳ Pending'}
								</Badge>
							</td>
							<td className="text-break">
								{command.errorMessage ? (
									<span className="text-danger">{command.errorMessage}</span>
								) : (
									<span className="text-muted">No errors</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</Table>
		</div>
	);
};

export default VoiceCommandTable;
