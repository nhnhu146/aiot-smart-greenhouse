import React from 'react';
import { Card, Spinner, Button } from 'react-bootstrap';
import { SortState, PaginationInfo } from '@/types/history';
import SensorDataTable from './SensorDataTable';
import DeviceControlTable from './DeviceControlTable';
import VoiceCommandTable from './VoiceCommandTable';
import PaginationControls from './PaginationControls';

interface HistoryTabContentProps {
	tab: 'sensors' | 'controls' | 'voice';
	data: any[];
	pagination: PaginationInfo;
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice' | 'alerts') => void;
	onPageChange: (page: number) => void;
	loading: boolean;
	onRefresh: () => void;
}

const HistoryTabContent: React.FC<HistoryTabContentProps> = ({
	tab,
	data,
	pagination,
	sortState,
	onSort,
	onPageChange,
	loading,
	onRefresh
}) => {
	const getTabIcon = () => {
		switch (tab) {
			case 'sensors': return '📊';
			case 'controls': return '🎛️';
			case 'voice': return '🎤';
		}
	};

	const getTabTitle = () => {
		switch (tab) {
			case 'sensors': return 'Sensor Data';
			case 'controls': return 'Device Controls';
			case 'voice': return 'Voice Commands';
		}
	};

	const renderTable = () => {
		switch (tab) {
			case 'sensors':
				return (
					<SensorDataTable
						data={data}
						sortState={sortState}
						onSort={onSort}
					/>
				);
			case 'controls':
				return (
					<DeviceControlTable
						data={data}
						sortState={sortState}
						onSort={onSort}
					/>
				);
			case 'voice':
				return (
					<VoiceCommandTable
						data={data}
						sortState={sortState}
						onSort={onSort}
					/>
				);
		}
	};

	if (loading) {
		return (
			<Card>
				<Card.Body className="text-center py-5">
					<Spinner animation="border" variant="primary" />
					<p className="mt-3 mb-0">Loading {getTabTitle().toLowerCase()}...</p>
				</Card.Body>
			</Card>
		);
	}

	return (
		<Card>
			<Card.Header className="d-flex justify-content-between align-items-center">
				<h5 className="mb-0">
					{getTabIcon()} {getTabTitle()}
					<span className="badge bg-primary ms-2">{pagination.total}</span>
				</h5>
				<Button variant="outline-primary" size="sm" onClick={onRefresh}>
					🔄 Refresh
				</Button>
			</Card.Header>
			<Card.Body className="p-0">
				{data.length === 0 ? (
					<div className="text-center py-5">
						<h5>No data found</h5>
						<p className="text-muted">Try adjusting your filters or check back later.</p>
					</div>
				) : (
					<>
						<div className="table-responsive">
							{renderTable()}
						</div>
						<div className="p-3 border-top">
							<PaginationControls
								pagination={pagination}
								onPageChange={onPageChange}
							/>
						</div>
					</>
				)}
			</Card.Body>
		</Card>
	);
};

export default HistoryTabContent;
