import React from 'react';
import { FilterState } from '@/types/history';
import { Button, Form, Row, Col } from 'react-bootstrap';

interface HistoryFiltersProps {
	filters: FilterState;
	showFilters: boolean;
	onFilterChange: (field: keyof FilterState, value: string) => void;
	onApplyFilters: () => void;
	onClearFilters: () => void;
	onToggleFilters: () => void;
	hasActiveFilters: boolean;
}

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
	filters,
	showFilters,
	onFilterChange,
	onApplyFilters,
	onClearFilters,
	onToggleFilters,
	hasActiveFilters
}) => {
	return (
		<>
			{/* Floating Filter Toggle Button */}
			<Button
				className={`floating-filter-toggle ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
				onClick={onToggleFilters}
				style={{
					position: 'fixed',
					top: '50%',
					right: '20px',
					zIndex: 1050,
					borderRadius: '25px',
					padding: '10px 20px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
					border: 'none',
					fontWeight: '600',
					transform: 'translateY(-50%)',
					transition: 'all 0.3s ease'
				}}
			>
				🔍  Filters
				{hasActiveFilters && <span className="badge bg-warning ms-2">{Object.values(filters).filter(v => v).length}</span>}
			</Button>

			{/* Floating Filter Panel */}
			{showFilters && (
				<div
					className="floating-filters-panel"
					style={{
						position: 'fixed',
						top: '50%',
						right: '20px',
						transform: 'translateY(-50%)',
						width: '400px',
						maxHeight: '80vh',
						overflowY: 'auto',
						backgroundColor: 'white',
						borderRadius: '12px',
						boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
						border: '1px solid #e9ecef',
						zIndex: 1040,
						padding: '20px'
					}}
				>
					<div className="d-flex justify-content-between align-items-center mb-3">
						<h5 className="mb-0">🔍 Data Filters</h5>
						<Button
							variant="outline-secondary"
							size="sm"
							onClick={onToggleFilters}
							style={{ borderRadius: '20px' }}
						>
							✕
						</Button>
					</div>

					<Row className="g-3">
						{/* Date Range Filters */}
						<Col md={6}>
							<Form.Group>
								<Form.Label>Date From</Form.Label>
								<Form.Control
									type="datetime-local"
									value={filters.dateFrom}
									onChange={(e) => onFilterChange('dateFrom', e.target.value)}
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group>
								<Form.Label>Date To</Form.Label>
								<Form.Control
									type="datetime-local"
									value={filters.dateTo}
									onChange={(e) => onFilterChange('dateTo', e.target.value)}
								/>
							</Form.Group>
						</Col>

						{/* Temperature Range */}
						<Col md={6}>
							<Form.Group>
								<Form.Label>Min Temperature (°C)</Form.Label>
								<Form.Control
									type="number"
									value={filters.minTemperature}
									onChange={(e) => onFilterChange('minTemperature', e.target.value)}
									placeholder="e.g. 20"
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group>
								<Form.Label>Max Temperature (°C)</Form.Label>
								<Form.Control
									type="number"
									value={filters.maxTemperature}
									onChange={(e) => onFilterChange('maxTemperature', e.target.value)}
									placeholder="e.g. 35"
								/>
							</Form.Group>
						</Col>

						{/* Humidity Range */}
						<Col md={6}>
							<Form.Group>
								<Form.Label>Min Humidity (%)</Form.Label>
								<Form.Control
									type="number"
									value={filters.minHumidity}
									onChange={(e) => onFilterChange('minHumidity', e.target.value)}
									placeholder="e.g. 40"
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group>
								<Form.Label>Max Humidity (%)</Form.Label>
								<Form.Control
									type="number"
									value={filters.maxHumidity}
									onChange={(e) => onFilterChange('maxHumidity', e.target.value)}
									placeholder="e.g. 80"
								/>
							</Form.Group>
						</Col>

						{/* Binary Sensor Filters */}
						<Col md={4}>
							<Form.Group>
								<Form.Label>Soil Moisture</Form.Label>
								<Form.Select
									value={filters.soilMoisture}
									onChange={(e) => onFilterChange('soilMoisture', e.target.value)}
								>
									<option value="">All</option>
									<option value="0">Dry</option>
									<option value="1">Wet</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={4}>
							<Form.Group>
								<Form.Label>Water Level</Form.Label>
								<Form.Select
									value={filters.waterLevel}
									onChange={(e) => onFilterChange('waterLevel', e.target.value)}
								>
									<option value="">All</option>
									<option value="0">Normal</option>
									<option value="1">Flooded</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={4}>
							<Form.Group>
								<Form.Label>Rain Status</Form.Label>
								<Form.Select
									value={filters.rainStatus}
									onChange={(e) => onFilterChange('rainStatus', e.target.value)}
								>
									<option value="">All</option>
									<option value="false">No Rain</option>
									<option value="true">Raining</option>
								</Form.Select>
							</Form.Group>
						</Col>

						{/* Device Filters */}
						<Col md={6}>
							<Form.Group>
								<Form.Label>Device Type</Form.Label>
								<Form.Select
									value={filters.deviceType}
									onChange={(e) => onFilterChange('deviceType', e.target.value)}
								>
									<option value="">All Devices</option>
									<option value="light">Light</option>
									<option value="pump">Pump</option>
									<option value="door">Door</option>
									<option value="window">Window</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group>
								<Form.Label>Control Action</Form.Label>
								<Form.Select
									value={filters.controlType}
									onChange={(e) => onFilterChange('controlType', e.target.value)}
								>
									<option value="">All Actions</option>
									<option value="on">Turn On</option>
									<option value="off">Turn Off</option>
									<option value="open">Open</option>
									<option value="close">Close</option>
								</Form.Select>
							</Form.Group>
						</Col>

						{/* Page Size */}
						<Col md={6}>
							<Form.Group>
								<Form.Label>Items per Page</Form.Label>
								<Form.Select
									value={filters.pageSize}
									onChange={(e) => onFilterChange('pageSize', e.target.value)}
								>
									<option value="10">10</option>
									<option value="20">20</option>
									<option value="50">50</option>
									<option value="100">100</option>
								</Form.Select>
							</Form.Group>
						</Col>
					</Row>

					<div className="filter-actions d-flex gap-2 mt-3">
						<Button
							variant="outline-secondary"
							size="sm"
							onClick={onClearFilters}
							style={{ borderRadius: '20px' }}
						>
							Clear All
						</Button>
						<Button
							variant="primary"
							size="sm"
							onClick={onApplyFilters}
							style={{ borderRadius: '20px' }}
						>
							Apply Filters
						</Button>
					</div>
				</div>
			)}
		</>
	);
};

export default HistoryFilters;
