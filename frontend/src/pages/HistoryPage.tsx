import { useEffect, useState } from "react";
import { Container, Card, Button, Alert, Tab, Tabs, Badge, Spinner, Form, Row, Col } from "react-bootstrap";
import mockDataService, {
	type ChartDataPoint,
	type DeviceControl,
} from "@/services/mockDataService";
import useWebSocket from "@/hooks/useWebSocket";
import './HistoryPage.css';

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface FilterState {
	// Date filters
	dateFrom: string;
	dateTo: string;

	// Value range filters
	minTemperature: string;
	maxTemperature: string;
	minHumidity: string;
	maxHumidity: string;
	minSoilMoisture: string;
	maxSoilMoisture: string;
	minWaterLevel: string;
	maxWaterLevel: string;

	// Specific value filters
	soilMoisture: string;
	waterLevel: string;
	rainStatus: string;

	// Device filters
	deviceType: string;
	controlType: string;
}

const HistoryPage = () => {
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [deviceControls, setDeviceControls] = useState<DeviceControl[]>([]);
	const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"sensors" | "controls" | "voice">("sensors");
	const [isExporting, setIsExporting] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	// Pagination states
	const [sensorPagination, setSensorPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});
	const [devicePagination, setDevicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});
	const [voicePagination, setVoicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false
	});

	// Filter states
	const [filters, setFilters] = useState<FilterState>({
		dateFrom: "",
		dateTo: "",
		minTemperature: "",
		maxTemperature: "",
		minHumidity: "",
		maxHumidity: "",
		minSoilMoisture: "",
		maxSoilMoisture: "",
		minWaterLevel: "",
		maxWaterLevel: "",
		soilMoisture: "",
		waterLevel: "",
		rainStatus: "",
		deviceType: "",
		controlType: ""
	});

	// WebSocket integration for real-time updates
	const { socket } = useWebSocket();

	// Count active filters  
	const getActiveFilterCount = () => {
		return Object.values(filters).filter(value => value !== "").length;
	};

	// Helper function to build query params
	const buildQueryParams = (pagination: PaginationInfo, filters: FilterState) => {
		const params = new URLSearchParams();
		params.append('page', pagination.page.toString());
		params.append('limit', pagination.limit.toString());

		if (filters.dateFrom) params.append('from', filters.dateFrom);
		if (filters.dateTo) params.append('to', filters.dateTo);
		if (filters.minTemperature) params.append('minTemperature', filters.minTemperature);
		if (filters.maxTemperature) params.append('maxTemperature', filters.maxTemperature);
		if (filters.minHumidity) params.append('minHumidity', filters.minHumidity);
		if (filters.maxHumidity) params.append('maxHumidity', filters.maxHumidity);
		if (filters.minSoilMoisture) params.append('minSoilMoisture', filters.minSoilMoisture);
		if (filters.maxSoilMoisture) params.append('maxSoilMoisture', filters.maxSoilMoisture);
		if (filters.minWaterLevel) params.append('minWaterLevel', filters.minWaterLevel);
		if (filters.maxWaterLevel) params.append('maxWaterLevel', filters.maxWaterLevel);
		if (filters.soilMoisture) params.append('soilMoisture', filters.soilMoisture);
		if (filters.waterLevel) params.append('waterLevel', filters.waterLevel);
		if (filters.rainStatus) params.append('rainStatus', filters.rainStatus);
		if (filters.deviceType) params.append('deviceType', filters.deviceType);
		if (filters.controlType) params.append('controlType', filters.controlType);

		return params.toString();
	};

	// Format timestamp to display date-time consistently
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);

		// Check if it's a valid date
		if (isNaN(date.getTime())) {
			// If it's already a formatted string, return as is
			return timestamp;
		}

		// Format as dd/mm/yyyy hh:mm:ss
		return date.toLocaleString("en-GB", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
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

	// Fetch sensor data from backend API
	const fetchSensorData = async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...sensorPagination, page }, filters);
			const response = await fetch(`${API_BASE_URL}/api/sensors?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch sensor data");
			}

			const result = await response.json();
			if (result.success) {
				// Transform API response to match our interface
				const transformedData = result.data.sensors?.map((item: any) => ({
					time: item.createdAt || item.timestamp,
					temperature: item.temperature || 0,
					humidity: item.humidity || 0,
					soilMoisture: item.soilMoisture || 0,
					waterLevel: item.waterLevel || 0,
					plantHeight: item.plantHeight || 0,
					rainStatus: item.rainStatus || false,
					lightLevel: item.lightLevel || 0,
				})) || [];

				setData(transformedData);
				setSensorPagination(result.data.pagination);
			} else {
				console.error("API returned error:", result.message);
				throw new Error(result.message);
			}
		} catch (error) {
			console.error("Failed to fetch sensor data:", error);
			// Fallback to mock data
			const mockResult = await mockDataService.getChartData();
			setData(mockResult.data);
			setIsUsingMockData(true);
		}
	};

	// Fetch device control history
	const fetchDeviceControls = async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...devicePagination, page }, filters);
			const response = await fetch(`${API_BASE_URL}/api/history/device-controls?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch device controls");
			}

			const result = await response.json();
			if (result.success) {
				setDeviceControls(result.data.controls || []);
				setDevicePagination(result.data.pagination);
			}
		} catch (error) {
			console.error("Failed to fetch device controls:", error);
		}
	};

	// Fetch voice commands history
	const fetchVoiceCommands = async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...voicePagination, page }, filters);
			const response = await fetch(`${API_BASE_URL}/api/voice-commands?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch voice commands");
			}

			const result = await response.json();
			if (result.success) {
				setVoiceCommands(result.data.commands || []);
				setVoicePagination(result.data.pagination);
			}
		} catch (error) {
			console.error("Failed to fetch voice commands:", error);
			setVoiceCommands([]);
		}
	};

	// Apply filters and refetch data
	const applyFilters = () => {
		setSensorPagination(prev => ({ ...prev, page: 1 }));
		setDevicePagination(prev => ({ ...prev, page: 1 }));
		setVoicePagination(prev => ({ ...prev, page: 1 }));

		fetchSensorData(1);
		fetchDeviceControls(1);
		fetchVoiceCommands(1);
	};

	// Clear all filters
	const clearFilters = () => {
		setFilters({
			dateFrom: "",
			dateTo: "",
			minTemperature: "",
			maxTemperature: "",
			minHumidity: "",
			maxHumidity: "",
			minSoilMoisture: "",
			maxSoilMoisture: "",
			minWaterLevel: "",
			maxWaterLevel: "",
			soilMoisture: "",
			waterLevel: "",
			rainStatus: "",
			deviceType: "",
			controlType: ""
		});
	};

	// Pagination handlers
	const handleSensorPageChange = (newPage: number) => {
		setSensorPagination(prev => ({ ...prev, page: newPage }));
		fetchSensorData(newPage);
	};

	const handleDevicePageChange = (newPage: number) => {
		setDevicePagination(prev => ({ ...prev, page: newPage }));
		fetchDeviceControls(newPage);
	};

	const handleVoicePageChange = (newPage: number) => {
		setVoicePagination(prev => ({ ...prev, page: newPage }));
		fetchVoiceCommands(newPage);
	};

	// Export to CSV with filters
	const exportToCSV = async () => {
		setIsExporting(true);
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			let exportUrl = "";
			let filename = "";

			switch (activeTab) {
				case "sensors":
					exportUrl = `/api/history/export/sensors`;
					filename = "sensor-data.csv";
					break;
				case "controls":
					exportUrl = `/api/history/export/device-controls`;
					filename = "device-controls.csv";
					break;
				case "voice":
					exportUrl = `/api/history/export/voice-commands`;
					filename = "voice-commands.csv";
					break;
			}

			// Build query params for export (without pagination)
			const queryParams = buildQueryParams({ page: 1, limit: 999999, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters);
			const response = await fetch(`${API_BASE_URL}${exportUrl}?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to export data");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error("Failed to export data:", error);
			alert("Failed to export data. Please try again.");
		} finally {
			setIsExporting(false);
		}
	};

	// Fetch data when component is mounted
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				await Promise.all([
					fetchSensorData(),
					fetchDeviceControls(),
					fetchVoiceCommands()
				]);
			} catch (error) {
				console.error("Failed to fetch history data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// WebSocket listener for real-time voice command updates
	useEffect(() => {
		if (socket) {
			const handleVoiceCommand = (command: VoiceCommand) => {
				setVoiceCommands(prev => [command, ...prev.slice(0, -1)]);
			};

			socket.on('voice-command', handleVoiceCommand);

			return () => {
				socket.off('voice-command', handleVoiceCommand);
			};
		}
	}, [socket]);

	if (isLoading) {
		return (
			<Container className="py-4">
				<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
					<div className="text-center">
						<Spinner animation="border" role="status" className="mb-3">
							<span className="visually-hidden">Loading...</span>
						</Spinner>
						<p className="text-muted">Loading history data...</p>
					</div>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>📊 Data History</h2>
				{isUsingMockData && (
					<Alert variant="warning" className="mb-0 py-2 px-3">
						⚠️ Using mock data (API unavailable)
					</Alert>
				)}
			</div>

			{/* Floating Filters */}
			<div className="d-flex justify-content-between align-items-center mb-4">
				<div className="floating-filter-container">
					<button
						className={`floating-filter-toggle ${showFilters ? 'active' : ''}`}
						onClick={() => setShowFilters(!showFilters)}
					>
						🔍 Filters
						{getActiveFilterCount() > 0 && (
							<span className="filter-badge">{getActiveFilterCount()}</span>
						)}
					</button>

					<div className={`floating-filter-menu ${showFilters ? 'show' : ''}`}>
						{/* Date Range Filters */}
						<div className="filter-section">
							<div className="filter-section-title">📅 Date Range</div>
							<Row className="g-2">
								<Col md={6}>
									<Form.Group>
										<Form.Label>From:</Form.Label>
										<Form.Control
											type="datetime-local"
											value={filters.dateFrom}
											onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
											size="sm"
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group>
										<Form.Label>To:</Form.Label>
										<Form.Control
											type="datetime-local"
											value={filters.dateTo}
											onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
											size="sm"
										/>
									</Form.Group>
								</Col>
							</Row>
						</div>

						{/* Sensor-specific filters */}
						{activeTab === "sensors" && (
							<div className="filter-section">
								<div className="filter-section-title">🌡️ Sensor Values</div>
								<Row className="g-2">
									<Col md={6}>
										<Form.Group>
											<Form.Label>🌱 Soil Moisture:</Form.Label>
											<Form.Select
												value={filters.soilMoisture}
												onChange={(e) => setFilters(prev => ({ ...prev, soilMoisture: e.target.value }))}
												size="sm"
											>
												<option value="">All</option>
												<option value="0">Dry (0)</option>
												<option value="1">Wet (1)</option>
											</Form.Select>
										</Form.Group>
									</Col>
									<Col md={6}>
										<Form.Group>
											<Form.Label>🌧️ Rain Status:</Form.Label>
											<Form.Select
												value={filters.rainStatus}
												onChange={(e) => setFilters(prev => ({ ...prev, rainStatus: e.target.value }))}
												size="sm"
											>
												<option value="">All</option>
												<option value="true">Raining</option>
												<option value="false">Not Raining</option>
											</Form.Select>
										</Form.Group>
									</Col>
								</Row>
							</div>
						)}

						{/* Device Control filters */}
						{activeTab === "controls" && (
							<div className="filter-section">
								<div className="filter-section-title">🎮 Device Controls</div>
								<Row className="g-2">
									<Col md={6}>
										<Form.Group>
											<Form.Label>Device Type:</Form.Label>
											<Form.Select
												value={filters.deviceType}
												onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
												size="sm"
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
											<Form.Label>Control Type:</Form.Label>
											<Form.Select
												value={filters.controlType}
												onChange={(e) => setFilters(prev => ({ ...prev, controlType: e.target.value }))}
												size="sm"
											>
												<option value="">All Types</option>
												<option value="auto">Automatic</option>
												<option value="manual">Manual</option>
											</Form.Select>
										</Form.Group>
									</Col>
								</Row>
							</div>
						)}

						{/* Filter Actions */}
						<div className="filter-actions">
							<Button variant="outline-secondary" size="sm" onClick={clearFilters}>
								Clear All
							</Button>
							<Button variant="primary" size="sm" onClick={() => { applyFilters(); setShowFilters(false); }}>
								Apply Filters
							</Button>
						</div>
					</div>
				</div>

				<Button
					variant="success"
					onClick={exportToCSV}
					disabled={isExporting}
					className="d-flex align-items-center"
				>
					{isExporting ? (
						<>
							<Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
							Exporting...
						</>
					) : (
						<>📤 Export CSV</>
					)}
				</Button>
			</div>

			<Tabs
				activeKey={activeTab}
				onSelect={(k) => setActiveTab(k as "sensors" | "controls" | "voice")}
				className="mb-4"
			>
				<Tab eventKey="sensors" title={`📊 Sensor Data (${data.length})`}>
					<Card>
						<Card.Header>
							<div className="d-flex justify-content-between align-items-center">
								<h5 className="mb-0">📊 Sensor Data History</h5>
								<small className="text-muted">
									Page {sensorPagination.page} of {sensorPagination.totalPages}
									({sensorPagination.total} total records)
								</small>
							</div>
						</Card.Header>
						<Card.Body>
							{data.length === 0 ? (
								<div className="text-center py-4 text-muted">
									<p>No sensor data available for the selected filters.</p>
								</div>
							) : (
								<>
									<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
										<table className="table table-striped table-hover">
											<thead className="table-light sticky-top">
												<tr>
													<th>Time</th>
													<th>Temperature (°C)</th>
													<th>Humidity (%)</th>
													<th>Soil Moisture</th>
													<th>Water Level</th>
													<th>Rain Status</th>
													<th>Plant Height (cm)</th>
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
																{item.soilMoisture ? 'Wet (1)' : 'Dry (0)'}
															</Badge>
														</td>
														<td>{item.waterLevel?.toFixed(1) || "N/A"}</td>
														<td>
															<Badge bg={item.rainStatus ? 'primary' : 'warning'}>
																{item.rainStatus ? '🌧️ Raining' : '☀️ Clear'}
															</Badge>
														</td>
														<td>{item.plantHeight?.toFixed(1) || "N/A"}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									{/* Pagination */}
									<div className="d-flex justify-content-between align-items-center mt-3">
										<Button
											variant="outline-primary"
											onClick={() => handleSensorPageChange(sensorPagination.page - 1)}
											disabled={!sensorPagination.hasPrev}
										>
											Previous
										</Button>
										<span className="text-muted">
											Page {sensorPagination.page} of {sensorPagination.totalPages}
										</span>
										<Button
											variant="outline-primary"
											onClick={() => handleSensorPageChange(sensorPagination.page + 1)}
											disabled={!sensorPagination.hasNext}
										>
											Next
										</Button>
									</div>
								</>
							)}
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="controls" title={`🎮 Device Controls (${deviceControls.length})`}>
					<Card>
						<Card.Header>
							<div className="d-flex justify-content-between align-items-center">
								<h5 className="mb-0">🎮 Device Control History</h5>
								<small className="text-muted">
									Page {devicePagination.page} of {devicePagination.totalPages}
									({devicePagination.total} total records)
								</small>
							</div>
						</Card.Header>
						<Card.Body>
							{deviceControls.length === 0 ? (
								<div className="text-center py-4 text-muted">
									<p>No device control data available for the selected filters.</p>
								</div>
							) : (
								<>
									<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
										<table className="table table-striped table-hover">
											<thead className="table-light sticky-top">
												<tr>
													<th>Time</th>
													<th>Device</th>
													<th>Action</th>
													<th>Status</th>
													<th>Control Type</th>
													<th>Triggered By</th>
													<th>Success</th>
												</tr>
											</thead>
											<tbody>
												{deviceControls.map((item, index) => (
													<tr key={index}>
														<td className="text-nowrap">{formatDateTime(item.timestamp)}</td>
														<td>{item.deviceType}</td>
														<td>{item.action}</td>
														<td>
															<Badge bg={item.status ? 'success' : 'secondary'}>
																{item.status ? 'ON' : 'OFF'}
															</Badge>
														</td>
														<td>
															<Badge bg={item.controlType === 'auto' ? 'info' : 'warning'}>
																{item.controlType}
															</Badge>
														</td>
														<td>{item.triggeredBy || 'N/A'}</td>
														<td>
															<Badge bg={item.success ? 'success' : 'danger'}>
																{item.success ? '✓' : '✗'}
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									{/* Pagination */}
									<div className="d-flex justify-content-between align-items-center mt-3">
										<Button
											variant="outline-primary"
											onClick={() => handleDevicePageChange(devicePagination.page - 1)}
											disabled={!devicePagination.hasPrev}
										>
											Previous
										</Button>
										<span className="text-muted">
											Page {devicePagination.page} of {devicePagination.totalPages}
										</span>
										<Button
											variant="outline-primary"
											onClick={() => handleDevicePageChange(devicePagination.page + 1)}
											disabled={!devicePagination.hasNext}
										>
											Next
										</Button>
									</div>
								</>
							)}
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="voice" title={`🎤 Voice Commands (${voiceCommands.length})`}>
					<Card>
						<Card.Header>
							<div className="d-flex justify-content-between align-items-center">
								<h5 className="mb-0">🎤 Voice Commands History</h5>
								<small className="text-muted">
									Page {voicePagination.page} of {voicePagination.totalPages}
									({voicePagination.total} total records)
								</small>
							</div>
						</Card.Header>
						<Card.Body>
							{voiceCommands.length === 0 ? (
								<div className="text-center py-4 text-muted">
									<p>No voice command data available.</p>
								</div>
							) : (
								<>
									<div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
										<table className="table table-striped table-hover">
											<thead className="table-light sticky-top">
												<tr>
													<th>Time</th>
													<th>Command</th>
													<th>Confidence</th>
													<th>Status</th>
													<th>Error</th>
												</tr>
											</thead>
											<tbody>
												{voiceCommands.map((command, index) => (
													<tr key={command.id || index}>
														<td className="text-nowrap">{formatDateTime(command.timestamp)}</td>
														<td>
															<code className="text-break">{command.command}</code>
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
																{command.errorMessage ? 'Error' : command.processed ? 'Processed' : 'Pending'}
															</Badge>
														</td>
														<td className="text-break">{command.errorMessage || 'N/A'}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									{/* Pagination */}
									<div className="d-flex justify-content-between align-items-center mt-3">
										<Button
											variant="outline-primary"
											onClick={() => handleVoicePageChange(voicePagination.page - 1)}
											disabled={!voicePagination.hasPrev}
										>
											Previous
										</Button>
										<span className="text-muted">
											Page {voicePagination.page} of {voicePagination.totalPages}
										</span>
										<Button
											variant="outline-primary"
											onClick={() => handleVoicePageChange(voicePagination.page + 1)}
											disabled={!voicePagination.hasNext}
										>
											Next
										</Button>
									</div>
								</>
							)}
						</Card.Body>
					</Card>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default HistoryPage;
