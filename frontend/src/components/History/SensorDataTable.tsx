import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { ChartDataPoint } from '@/services/mockDataService';
import { SortState } from '@/types/history';
import SortableHeader from './SortableHeader';

interface SensorDataTableProps {
	data: ChartDataPoint[];
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice') => void;
}

const SensorDataTable: React.FC<SensorDataTableProps> = ({ data, sortState, onSort }) => {
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
			<Table striped hover className="history-table">
				<thead className="table-light sticky-top">
					<tr>
						<SortableHeader field="createdAt" tab="sensors" sortState={sortState} onSort={onSort}>
							Time
						</SortableHeader>
						<SortableHeader field="temperature" tab="sensors" sortState={sortState} onSort={onSort}>
							Temperature (°C)
						</SortableHeader>
						<SortableHeader field="humidity" tab="sensors" sortState={sortState} onSort={onSort}>
							Humidity (%)
						</SortableHeader>
						<SortableHeader field="soilMoisture" tab="sensors" sortState={sortState} onSort={onSort}>
							Soil Moisture
						</SortableHeader>
						<SortableHeader field="waterLevel" tab="sensors" sortState={sortState} onSort={onSort}>
							Water Level
						</SortableHeader>
						<SortableHeader field="lightLevel" tab="sensors" sortState={sortState} onSort={onSort}>
							Light Level
						</SortableHeader>
						<SortableHeader field="rainStatus" tab="sensors" sortState={sortState} onSort={onSort}>
							Rain Status
						</SortableHeader>
						<SortableHeader field="plantHeight" tab="sensors" sortState={sortState} onSort={onSort}>
							Plant Height (cm)
						</SortableHeader>
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
