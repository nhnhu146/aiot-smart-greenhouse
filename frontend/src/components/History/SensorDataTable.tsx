import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { ChartDataPoint } from '@/services/mockDataService';
import { SortState } from '@/types/history';

interface SensorDataTableProps {
	data: ChartDataPoint[];
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice') => void;
}

const SensorDataTable: React.FC<SensorDataTableProps> = ({ data, sortState, onSort }) => {
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

	const formatBinaryValue = (value: number | boolean | undefined, trueLabel: string, falseLabel: string) => {
		if (value === undefined || value === null) return 'N/A';
		const isTrue = value === 1 || value === true;
		return isTrue ? trueLabel : falseLabel;
	};

	return (
		<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
			<Table striped hover>
				<thead className="table-light sticky-top">
					<tr>
						<th className="sortable-header" onClick={() => onSort('time', 'sensors')}>
							Time{getSortIcon('time', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('temperature', 'sensors')}>
							Temperature (°C){getSortIcon('temperature', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('humidity', 'sensors')}>
							Humidity (%){getSortIcon('humidity', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('soilMoisture', 'sensors')}>
							Soil Moisture{getSortIcon('soilMoisture', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('waterLevel', 'sensors')}>
							Water Level{getSortIcon('waterLevel', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('lightLevel', 'sensors')}>
							Light Level{getSortIcon('lightLevel', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('rainStatus', 'sensors')}>
							Rain Status{getSortIcon('rainStatus', 'sensors')}
						</th>
						<th className="sortable-header" onClick={() => onSort('plantHeight', 'sensors')}>
							Plant Height (cm){getSortIcon('plantHeight', 'sensors')}
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item, index) => (
						<tr key={index}>
							<td className="text-nowrap">{formatDateTime(item.time)}</td>
							<td>{item.temperature?.toFixed(1) || "N/A"}</td>
							<td>{item.humidity?.toFixed(1) || "N/A"}</td>
							<td>
								<Badge bg={item.soilMoisture ? 'success' : 'danger'}>
									{formatBinaryValue(item.soilMoisture, 'Wet (1)', 'Dry (0)')}
								</Badge>
							</td>
							<td>
								<Badge bg={item.waterLevel ? 'warning' : 'success'}>
									{formatBinaryValue(item.waterLevel, 'Flooded (1)', 'Normal (0)')}
								</Badge>
							</td>
							<td>
								<Badge bg={item.lightLevel ? 'warning' : 'secondary'}>
									{formatBinaryValue(item.lightLevel, 'Bright (1)', 'Dark (0)')}
								</Badge>
							</td>
							<td>
								<Badge bg={item.rainStatus ? 'primary' : 'warning'}>
									{formatBinaryValue(item.rainStatus, '🌧️ Raining', '☀️ Clear')}
								</Badge>
							</td>
							<td>{item.plantHeight?.toFixed(1) || "N/A"}</td>
						</tr>
					))}
				</tbody>
			</Table>
		</div>
	);
};

export default SensorDataTable;
