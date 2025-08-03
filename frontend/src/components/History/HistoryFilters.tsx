import React from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import { FilterState } from '@/types/history';

interface HistoryFiltersProps {
	filters: FilterState;
	showFilters: boolean;
	currentTab?: 'sensors' | 'controls' | 'voice' | 'alerts';
	onFilterChange: (field: keyof FilterState, value: string) => void;
	onClearFilters: () => void;
	onApplyFilters: () => void;
	hasActiveFilters?: boolean;
}

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
	filters,
	showFilters,
	currentTab,
	onFilterChange,
	onClearFilters,
	onApplyFilters
}) => {
	const handleInputChange = (field: keyof FilterState, value: string) => {
		onFilterChange(field, value);
	};

	if (!showFilters) return null;

	return (
		<div className="floating-filter-overlay" onClick={(e) => e.target === e.currentTarget && onApplyFilters && onApplyFilters()}>
			<Card className="floating-filter-menu shadow-lg">
				<Card.Header className="d-flex justify-content-between align-items-center">
					<h5 className="mb-0">🔍 Filter Data</h5>
					<Button variant="outline-secondary" size="sm" onClick={onApplyFilters}>
						✕
					</Button>
				</Card.Header>
				<Card.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
					<div className="filter-section">
						<div className="filter-section-title">📅 Date Range</div>
						<Row className="mb-3">
							<Col md={6}>
								<Form.Label>From</Form.Label>
								<Form.Control
									type="datetime-local"
									value={filters.dateFrom}
									onChange={(e) => handleInputChange('dateFrom', e.target.value)}
									size="sm"
								/>
							</Col>
							<Col md={6}>
								<Form.Label>To</Form.Label>
								<Form.Control
									type="datetime-local"
									value={filters.dateTo}
									onChange={(e) => handleInputChange('dateTo', e.target.value)}
									size="sm"
								/>
							</Col>
						</Row>
					</div>

					<div className="filter-section">
						<div className="filter-section-title">🌡️ Temperature Range (°C)</div>
						<Row className="mb-3">
							<Col md={6}>
								<Form.Label>Min Temperature</Form.Label>
								<Form.Control
									type="number"
									placeholder="Min °C"
									value={filters.minTemperature}
									onChange={(e) => handleInputChange('minTemperature', e.target.value)}
									size="sm"
								/>
							</Col>
							<Col md={6}>
								<Form.Label>Max Temperature</Form.Label>
								<Form.Control
									type="number"
									placeholder="Max °C"
									value={filters.maxTemperature}
									onChange={(e) => handleInputChange('maxTemperature', e.target.value)}
									size="sm"
								/>
							</Col>
						</Row>
					</div>

					<div className="filter-section">
						<div className="filter-section-title">💧 Humidity Range (%)</div>
						<Row className="mb-3">
							<Col md={6}>
								<Form.Label>Min Humidity</Form.Label>
								<Form.Control
									type="number"
									placeholder="Min %"
									value={filters.minHumidity}
									onChange={(e) => handleInputChange('minHumidity', e.target.value)}
									size="sm"
								/>
							</Col>
							<Col md={6}>
								<Form.Label>Max Humidity</Form.Label>
								<Form.Control
									type="number"
									placeholder="Max %"
									value={filters.maxHumidity}
									onChange={(e) => handleInputChange('maxHumidity', e.target.value)}
									size="sm"
								/>
							</Col>
						</Row>
					</div>

					<div className="filter-section">
						<div className="filter-section-title">🌱 Soil & Water</div>
						<Row className="mb-3">
							<Col md={6}>
								<Form.Label>Soil Moisture</Form.Label>
								<Form.Select
									value={filters.soilMoisture}
									onChange={(e) => handleInputChange('soilMoisture', e.target.value)}
									size="sm"
								>
									<option value="">Any</option>
									<option value="0">Dry (0)</option>
									<option value="1">Wet (1)</option>
								</Form.Select>
							</Col>
							<Col md={6}>
								<Form.Label>Water Level</Form.Label>
								<Form.Select
									value={filters.waterLevel}
									onChange={(e) => handleInputChange('waterLevel', e.target.value)}
									size="sm"
								>
									<option value="">Any</option>
									<option value="0">Normal (0)</option>
									<option value="1">Flooded (1)</option>
								</Form.Select>
							</Col>
						</Row>
					</div>

					<div className="filter-section">
						<div className="filter-section-title">🌧️ Weather & Devices</div>
						<Row className="mb-3">
							<Col md={6}>
								<Form.Label>Rain Status</Form.Label>
								<Form.Select
									value={filters.rainStatus}
									onChange={(e) => handleInputChange('rainStatus', e.target.value)}
									size="sm"
								>
									<option value="">Any</option>
									<option value="true">Raining</option>
									<option value="false">Not Raining</option>
								</Form.Select>
							</Col>
							<Col md={6}>
								<Form.Label>Device Type</Form.Label>
								<Form.Select
									value={filters.deviceType}
									onChange={(e) => handleInputChange('deviceType', e.target.value)}
									size="sm"
								>
									<option value="">All Devices</option>
									<option value="light">💡 Light</option>
									<option value="pump">💧 Pump</option>
									<option value="door">🚪 Door</option>
									<option value="window">🪟 Window</option>
								</Form.Select>
							</Col>
						</Row>
					</div>

					{/* Device Control Specific Filters - Only show for controls tab */}
					{currentTab === 'controls' && (
						<div className="filter-section">
							<div className="filter-section-title">🎛️ Device Controls</div>
							<Row className="mb-3">
								<Col md={6}>
									<Form.Label>Control Type</Form.Label>
									<Form.Select
										value={filters.controlType}
										onChange={(e) => handleInputChange('controlType', e.target.value)}
										size="sm"
									>
										<option value="">All Types</option>
										<option value="auto">🤖 Automatic</option>
										<option value="manual">👤 Manual</option>
									</Form.Select>
								</Col>
								<Col md={6}>
									<Form.Label>Action</Form.Label>
									<Form.Select
										value={filters.action}
										onChange={(e) => handleInputChange('action', e.target.value)}
										size="sm"
									>
										<option value="">All Actions</option>
										<option value="on">🟢 Turn On</option>
										<option value="off">🔴 Turn Off</option>
										<option value="open">📂 Open</option>
										<option value="close">📁 Close</option>
									</Form.Select>
								</Col>
							</Row>
							<Row className="mb-3">
								<Col md={6}>
									<Form.Label>Device ID</Form.Label>
									<Form.Control
										type="text"
										placeholder="Device ID"
										value={filters.deviceId}
										onChange={(e) => handleInputChange('deviceId', e.target.value)}
										size="sm"
									/>
								</Col>
								<Col md={6}>
									<Form.Label>Success Status</Form.Label>
									<Form.Select
										value={filters.success}
										onChange={(e) => handleInputChange('success', e.target.value)}
										size="sm"
									>
										<option value="">All Results</option>
										<option value="true">✅ Success</option>
										<option value="false">❌ Failed</option>
									</Form.Select>
								</Col>
							</Row>
							<Row className="mb-3">
								<Col md={6}>
									<Form.Label>User ID (Manual)</Form.Label>
									<Form.Control
										type="text"
										placeholder="User ID"
										value={filters.userId}
										onChange={(e) => handleInputChange('userId', e.target.value)}
										size="sm"
									/>
								</Col>
								<Col md={6}>
									<Form.Label>Triggered By (Auto)</Form.Label>
									<Form.Control
										type="text"
										placeholder="Sensor or trigger"
										value={filters.triggeredBy}
										onChange={(e) => handleInputChange('triggeredBy', e.target.value)}
										size="sm"
									/>
								</Col>
							</Row>
						</div>
					)}

					<div className="filter-section">
						<div className="filter-section-title">📄 Results Per Page</div>
						<Row className="mb-3">
							<Col md={6}>
								<Form.Label>Page Size</Form.Label>
								<Form.Select
									value={filters.pageSize}
									onChange={(e) => handleInputChange('pageSize', e.target.value)}
									size="sm"
								>
									<option value="20">20 per page</option>
									<option value="50">50 per page</option>
									<option value="100">100 per page</option>
									<option value="200">200 per page</option>
								</Form.Select>
							</Col>
						</Row>
					</div>
				</Card.Body>
				<Card.Footer className="d-flex justify-content-between">
					<Button variant="outline-secondary" onClick={onClearFilters}>
						🗑️ Clear All
					</Button>
					<Button variant="primary" onClick={onApplyFilters}>
						✅ Apply Filters
					</Button>
				</Card.Footer>
			</Card>
		</div>
	);
};

export default HistoryFilters;
