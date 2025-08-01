import { useEffect, useState } from "react";
import { Container, Button, Alert, Tab, Tabs, Spinner, Form, Row, Col } from "react-bootstrap";
import mockDataService, {
	type ChartDataPoint,
	type DeviceControl,
} from "@/services/mockDataService";
import useWebSocket from "@/hooks/useWebSocket";
import { FilterState, PaginationInfo } from "@/types/history";
import SensorDataTable from "@/components/History/SensorDataTable";
import DeviceControlTable from "@/components/History/DeviceControlTable";
import VoiceCommandTable from "@/components/History/VoiceCommandTable";
import TabContent from "@/components/History/TabContent";
import './HistoryPage.css';

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
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


	// Data counts for nav tabs
	const [dataCounts, setDataCounts] = useState({
		sensors: 0,
		devices: 0,
		voice: 0
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
		controlType: "",
		pageSize: "20"
	});


	// Sorting states
	const [sensorSort, setSensorSort] = useState({ field: 'time', direction: 'desc' });
	const [deviceSort, setDeviceSort] = useState({ field: 'timestamp', direction: 'desc' });
	const [voiceSort, setVoiceSort] = useState({ field: 'timestamp', direction: 'desc' });

	// WebSocket integration for real-time updates
	const { socket } = useWebSocket();

	// Count active filters  
	const getActiveFilterCount = () => {
		return Object.values(filters).filter(value => value !== "").length;
	};


	// Handle column sorting
	const handleSort = (field: string, tabType: string) => {
		if (tabType === 'sensors') {
			const newDirection = sensorSort.field === field && sensorSort.direction === 'desc' ? 'asc' : 'desc';
			setSensorSort({ field, direction: newDirection });
			// Trigger data refetch with new sort
			fetchSensorData(1);
		} else if (tabType === 'devices') {
			const newDirection = deviceSort.field === field && deviceSort.direction === 'desc' ? 'asc' : 'desc';
			setDeviceSort({ field, direction: newDirection });
			fetchDeviceControls(1);
		} else if (tabType === 'voice') {
			const newDirection = voiceSort.field === field && voiceSort.direction === 'desc' ? 'asc' : 'desc';
			setVoiceSort({ field, direction: newDirection });
			fetchVoiceCommands(1);
		}
	};

	// Helper function to build query params
	const buildQueryParams = (pagination: PaginationInfo, filters: FilterState, sortField?: string, sortDirection?: string) => {
		const params = new URLSearchParams();
		params.append('page', pagination.page.toString());
		params.append('limit', pagination.limit.toString());

		// Add sorting parameters
		if (sortField) params.append('sortField', sortField);
		if (sortDirection) params.append('sortDirection', sortDirection);

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

	// Fetch data counts for navigation tabs
	const fetchDataCounts = async () => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

			const [sensorsRes, devicesRes, voiceRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/sensors/count`),
				fetch(`${API_BASE_URL}/api/history/device-controls/count`),
				fetch(`${API_BASE_URL}/api/voice-commands/count`)
			]);

			const sensorsData = await sensorsRes.json();
			const devicesData = await devicesRes.json();
			const voiceData = await voiceRes.json();

			setDataCounts({
				sensors: sensorsData.count || 0,
				devices: devicesData.count || 0,
				voice: voiceData.count || 0
			});
		} catch (error) {
			console.error('Failed to fetch data counts:', error);
		}
	};

	// Fetch sensor data from backend API
	const fetchSensorData = async (page: number = 1) => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const queryParams = buildQueryParams({ ...sensorPagination, page }, filters, sensorSort.field, sensorSort.direction);
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
			const queryParams = buildQueryParams({ ...devicePagination, page }, filters, deviceSort.field, deviceSort.direction);
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
			const queryParams = buildQueryParams({ ...voicePagination, page }, filters, voiceSort.field, voiceSort.direction);
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
			controlType: "",
			pageSize: "20"
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
					fetchVoiceCommands(),
					fetchDataCounts()
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
							<>
								<div className="filter-section">
									<div className="filter-section-title">🌡️ Temperature Range (°C)</div>
									<Row className="g-2">
										<Col md={6}>
											<Form.Group>
												<Form.Label>Min Temperature:</Form.Label>
												<Form.Control
													type="number"
													value={filters.minTemperature}
													onChange={(e) => setFilters(prev => ({ ...prev, minTemperature: e.target.value }))}
													size="sm"
													step="0.1"
													placeholder="e.g. 20.0"
												/>
											</Form.Group>
										</Col>
										<Col md={6}>
											<Form.Group>
												<Form.Label>Max Temperature:</Form.Label>
												<Form.Control
													type="number"
													value={filters.maxTemperature}
													onChange={(e) => setFilters(prev => ({ ...prev, maxTemperature: e.target.value }))}
													size="sm"
													step="0.1"
													placeholder="e.g. 35.0"
												/>
											</Form.Group>
										</Col>
									</Row>
								</div>

								<div className="filter-section">
									<div className="filter-section-title">💧 Humidity Range (%)</div>
									<Row className="g-2">
										<Col md={6}>
											<Form.Group>
												<Form.Label>Min Humidity:</Form.Label>
												<Form.Control
													type="number"
													value={filters.minHumidity}
													onChange={(e) => setFilters(prev => ({ ...prev, minHumidity: e.target.value }))}
													size="sm"
													step="0.1"
													min="0"
													max="100"
													placeholder="e.g. 40.0"
												/>
											</Form.Group>
										</Col>
										<Col md={6}>
											<Form.Group>
												<Form.Label>Max Humidity:</Form.Label>
												<Form.Control
													type="number"
													value={filters.maxHumidity}
													onChange={(e) => setFilters(prev => ({ ...prev, maxHumidity: e.target.value }))}
													size="sm"
													step="0.1"
													min="0"
													max="100"
													placeholder="e.g. 80.0"
												/>
											</Form.Group>
										</Col>
									</Row>
								</div>

								<div className="filter-section">
									<div className="filter-section-title">🌱 Binary Sensors</div>
									<Row className="g-2">
										<Col md={4}>
											<Form.Group>
												<Form.Label>Soil Moisture:</Form.Label>
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
										<Col md={4}>
											<Form.Group>
												<Form.Label>Water Level:</Form.Label>
												<Form.Select
													value={filters.waterLevel}
													onChange={(e) => setFilters(prev => ({ ...prev, waterLevel: e.target.value }))}
													size="sm"
												>
													<option value="">All</option>
													<option value="0">Low (0)</option>
													<option value="1">Full (1)</option>
												</Form.Select>
											</Form.Group>
										</Col>
										<Col md={4}>
											<Form.Group>
												<Form.Label>Rain Status:</Form.Label>
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
							</>
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

						{/* Page Size Selector */}
						<Row className="mb-3">
							<Col md={4}>
								<Form.Group>
									<Form.Label>Records per page:</Form.Label>
									<Form.Select
										value={filters.pageSize}
										onChange={(e) => {
											setFilters(prev => ({ ...prev, pageSize: e.target.value }));
											// Update pagination limits for all tabs
											const newLimit = parseInt(e.target.value);
											setSensorPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
											setDevicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
											setVoicePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
											// Refetch data with new page size
											applyFilters();
										}}
										size="sm"
									>
										<option value="10">10</option>
										<option value="20">20</option>
										<option value="50">50</option>
										<option value="100">100</option>
									</Form.Select>
								</Form.Group>
							</Col>
						</Row>

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
				<Tab eventKey="sensors" title={`📊 Sensor Data (${dataCounts.sensors})`}>
					<TabContent
						title="Sensor Data History"
						icon="📊"
						pagination={sensorPagination}
						onPageChange={handleSensorPageChange}
						isEmpty={data.length === 0}
						emptyMessage="No sensor data available for the selected filters."
					>
						<SensorDataTable
							data={data}
							sortState={{ field: sensorSort.field, direction: sensorSort.direction as 'asc' | 'desc', tab: 'sensors' }}
							onSort={handleSort}
						/>
					</TabContent>
				</Tab>

				<Tab eventKey="controls" title={`🎮 Device Controls (${dataCounts.devices})`}>
					<TabContent
						title="Device Control History"
						icon="🎮"
						pagination={devicePagination}
						onPageChange={handleDevicePageChange}
						isEmpty={deviceControls.length === 0}
						emptyMessage="No device control data available for the selected filters."
					>
						<DeviceControlTable
							data={deviceControls}
							sortState={{ field: deviceSort.field, direction: deviceSort.direction as 'asc' | 'desc', tab: 'controls' }}
							onSort={handleSort}
						/>
					</TabContent>
				</Tab>

				<Tab eventKey="voice" title={`🎤 Voice Commands (${dataCounts.voice})`}>
					<TabContent
						title="Voice Commands History"
						icon="🎤"
						pagination={voicePagination}
						onPageChange={handleVoicePageChange}
						isEmpty={voiceCommands.length === 0}
						emptyMessage="No voice command data available."
					>
						<VoiceCommandTable
							data={voiceCommands}
							sortState={{ field: voiceSort.field, direction: voiceSort.direction as 'asc' | 'desc', tab: 'voice' }}
							onSort={handleSort}
						/>
					</TabContent>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default HistoryPage;
