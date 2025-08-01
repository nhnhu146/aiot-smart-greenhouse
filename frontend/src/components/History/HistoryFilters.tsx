import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { FilterState } from '@/types/history';

interface HistoryFiltersProps {
	filters: FilterState;
	showFilters: boolean;
	onFilterChange: (field: keyof FilterState, value: string) => void;
	onApplyFilters: () => void;
	onClearFilters: () => void;
	onToggleFilters: () => void;
}

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
	filters,
	showFilters,
	onFilterChange,
	onApplyFilters,
	onClearFilters,
	onToggleFilters
}) => {
	return (
		<div className="floating-filter-container">
			<Button
				variant="primary"
				onClick={onToggleFilters}
				className={`floating-filter-toggle ${showFilters ? 'active' : ''}`}
			>
				🔍 Filters
				{Object.values(filters).some(v => v !== '') && (
					<span className="filter-badge">Active</span>
				)}
			</Button>

			<div className={`floating-filter-menu ${showFilters ? 'show' : ''}`}>
				<div className="filter-section">
					<div className="filter-section-title">📅 Date Range</div>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-2">
								<Form.Label>From Date</Form.Label>
								<Form.Control
									type="datetime-local"
									value={filters.dateFrom}
									onChange={(e) => onFilterChange('dateFrom', e.target.value)}
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-2">
								<Form.Label>To Date</Form.Label>
								<Form.Control
									type="datetime-local"
									value={filters.dateTo}
									onChange={(e) => onFilterChange('dateTo', e.target.value)}
								/>
							</Form.Group>
						</Col>
					</Row>
				</div>

				<div className="filter-section">
					<div className="filter-section-title">🌡️ Temperature Range (°C)</div>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-2">
								<Form.Label>Min</Form.Label>
								<Form.Control
									type="number"
									placeholder="Min temp"
									value={filters.minTemperature}
									onChange={(e) => onFilterChange('minTemperature', e.target.value)}
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-2">
								<Form.Label>Max</Form.Label>
								<Form.Control
									type="number"
									placeholder="Max temp"
									value={filters.maxTemperature}
									onChange={(e) => onFilterChange('maxTemperature', e.target.value)}
								/>
							</Form.Group>
						</Col>
					</Row>
				</div>

				<div className="filter-section">
					<div className="filter-section-title">💧 Humidity Range (%)</div>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-2">
								<Form.Label>Min</Form.Label>
								<Form.Control
									type="number"
									placeholder="Min humidity"
									value={filters.minHumidity}
									onChange={(e) => onFilterChange('minHumidity', e.target.value)}
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-2">
								<Form.Label>Max</Form.Label>
								<Form.Control
									type="number"
									placeholder="Max humidity"
									value={filters.maxHumidity}
									onChange={(e) => onFilterChange('maxHumidity', e.target.value)}
								/>
							</Form.Group>
						</Col>
					</Row>
				</div>

				<div className="filter-section">
					<div className="filter-section-title">🌱 Binary Sensors</div>
					<Row>
						<Col md={4}>
							<Form.Group className="mb-2">
								<Form.Label>Soil Moisture</Form.Label>
								<Form.Select
									value={filters.soilMoisture}
									onChange={(e) => onFilterChange('soilMoisture', e.target.value)}
								>
									<option value="">All</option>
									<option value="0">Dry (0)</option>
									<option value="1">Wet (1)</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={4}>
							<Form.Group className="mb-2">
								<Form.Label>Water Level</Form.Label>
								<Form.Select
									value={filters.waterLevel}
									onChange={(e) => onFilterChange('waterLevel', e.target.value)}
								>
									<option value="">All</option>
									<option value="0">None (0)</option>
									<option value="1">Full (1)</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={4}>
							<Form.Group className="mb-2">
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
					</Row>
				</div>

				<div className="filter-section">
					<div className="filter-section-title">📄 Results</div>
					<Form.Group className="mb-2">
						<Form.Label>Page Size</Form.Label>
						<Form.Select
							value={filters.pageSize}
							onChange={(e) => onFilterChange('pageSize', e.target.value)}
						>
							<option value="10">10 per page</option>
							<option value="20">20 per page</option>
							<option value="50">50 per page</option>
							<option value="100">100 per page</option>
						</Form.Select>
					</Form.Group>
				</div>

				<div className="filter-actions">
					<Button variant="outline-secondary" size="sm" onClick={onClearFilters}>
						Clear All
					</Button>
					<Button variant="primary" size="sm" onClick={() => { onApplyFilters(); onToggleFilters(); }}>
						Apply Filters
					</Button>
				</div>
			</div>
		</div>
	);
};

export default HistoryFilters;
