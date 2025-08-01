import { useEffect, useState } from "react";
import mockDataService, {
	type ChartDataPoint,
	type DeviceControl,
} from "@/services/mockDataService";
import useWebSocket from "@/hooks/useWebSocket";
import "./HistoryPage.css";

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	response?: string;
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
					motionDetected: item.motionDetected || false,
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
				setDeviceControls(result.data.deviceControls || []);
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
			<div className="history-container">
				<div className="loading-container">
					<div className="loading-spinner"></div>
					<p>Loading history data...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="history-container">
			{/* Header */}
			<div className="history-header">
				<h2>📊 Data History</h2>
				{isUsingMockData && (
					<div className="mock-data-notice">
						⚠️ Using mock data (API unavailable)
					</div>
				)}
				<button
					className="export-btn"
					onClick={exportToCSV}
					disabled={isExporting}
				>
					{isExporting ? "Exporting..." : "📁 Export CSV"}
				</button>
			</div>

			{/* Filters Section */}
			<div className="filters-section">
				<div className="filters-header">
					<h3>🔍 Filters</h3>
					<button onClick={clearFilters} className="clear-filters-btn">Clear All</button>
				</div>

				{/* Date Range Filters */}
				<div className="filter-group">
					<label>📅 Date Range:</label>
					<input
						type="datetime-local"
						value={filters.dateFrom}
						onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
						placeholder="From"
					/>
					<input
						type="datetime-local"
						value={filters.dateTo}
						onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
						placeholder="To"
					/>
				</div>

				{/* Value Range Filters for Sensors */}
				{activeTab === "sensors" && (
					<>
						<div className="filter-group">
							<label>🌡️ Temperature Range (°C):</label>
							<input
								type="number"
								value={filters.minTemperature}
								onChange={(e) => setFilters(prev => ({ ...prev, minTemperature: e.target.value }))}
								placeholder="Min"
								step="0.1"
							/>
							<input
								type="number"
								value={filters.maxTemperature}
								onChange={(e) => setFilters(prev => ({ ...prev, maxTemperature: e.target.value }))}
								placeholder="Max"
								step="0.1"
							/>
						</div>

						<div className="filter-group">
							<label>💧 Humidity Range (%):</label>
							<input
								type="number"
								value={filters.minHumidity}
								onChange={(e) => setFilters(prev => ({ ...prev, minHumidity: e.target.value }))}
								placeholder="Min"
								step="0.1"
							/>
							<input
								type="number"
								value={filters.maxHumidity}
								onChange={(e) => setFilters(prev => ({ ...prev, maxHumidity: e.target.value }))}
								placeholder="Max"
								step="0.1"
							/>
						</div>

						<div className="filter-group">
							<label>🌱 Soil Moisture:</label>
							<select
								value={filters.soilMoisture}
								onChange={(e) => setFilters(prev => ({ ...prev, soilMoisture: e.target.value }))}
							>
								<option value="">All</option>
								<option value="0">Dry (0)</option>
								<option value="1">Wet (1)</option>
							</select>
						</div>

						<div className="filter-group">
							<label>🌧️ Rain Status:</label>
							<select
								value={filters.rainStatus}
								onChange={(e) => setFilters(prev => ({ ...prev, rainStatus: e.target.value }))}
							>
								<option value="">All</option>
								<option value="true">Raining</option>
								<option value="false">Not Raining</option>
							</select>
						</div>
					</>
				)}

				{/* Device Type Filters for Controls */}
				{activeTab === "controls" && (
					<>
						<div className="filter-group">
							<label>🎮 Device Type:</label>
							<select
								value={filters.deviceType}
								onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
							>
								<option value="">All Devices</option>
								<option value="light">Light</option>
								<option value="pump">Pump</option>
								<option value="door">Door</option>
								<option value="window">Window</option>
							</select>
						</div>

						<div className="filter-group">
							<label>⚙️ Control Type:</label>
							<select
								value={filters.controlType}
								onChange={(e) => setFilters(prev => ({ ...prev, controlType: e.target.value }))}
							>
								<option value="">All Types</option>
								<option value="auto">Automatic</option>
								<option value="manual">Manual</option>
							</select>
						</div>
					</>
				)}

				<button onClick={applyFilters} className="apply-filters-btn">Apply Filters</button>
			</div>

			{/* Tab Navigation */}
			<div className="tab-navigation">
				<button
					className={`tab-btn ${activeTab === "sensors" ? "active" : ""}`}
					onClick={() => setActiveTab("sensors")}
				>
					📊 Sensor Data ({data.length})
				</button>
				<button
					className={`tab-btn ${activeTab === "controls" ? "active" : ""}`}
					onClick={() => setActiveTab("controls")}
				>
					🎮 Device Controls ({deviceControls.length})
				</button>
				<button
					className={`tab-btn ${activeTab === "voice" ? "active" : ""}`}
					onClick={() => setActiveTab("voice")}
				>
					🎤 Voice Commands ({voiceCommands.length})
				</button>
			</div>

			{/* Content based on active tab */}
			{activeTab === "sensors" ? (
				<div className="sensor-data-section">
					<div className="section-header">
						<h3>📊 Sensor Data History</h3>
						<div className="pagination-info">
							Page {sensorPagination.page} of {sensorPagination.totalPages}
							({sensorPagination.total} total records)
						</div>
					</div>

					{data.length === 0 ? (
						<div className="no-data">No sensor data available for the selected filters.</div>
					) : (
						<>
							<div className="data-table-wrapper">
								<table className="data-table">
									<thead>
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
												<td>{formatDateTime(item.time)}</td>
												<td>{item.temperature?.toFixed(1) || "N/A"}</td>
												<td>{item.humidity?.toFixed(1) || "N/A"}</td>
												<td>
													<span className={`soil-moisture ${item.soilMoisture ? 'wet' : 'dry'}`}>
														{item.soilMoisture ? 'Wet (1)' : 'Dry (0)'}
													</span>
												</td>
												<td>{item.waterLevel?.toFixed(1) || "N/A"}</td>
												<td>
													<span className={`rain-status ${item.rainStatus ? 'raining' : 'clear'}`}>
														{item.rainStatus ? '🌧️ Raining' : '☀️ Clear'}
													</span>
												</td>
												<td>{item.plantHeight?.toFixed(1) || "N/A"}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination Controls */}
							<div className="pagination-controls">
								<button
									onClick={() => handleSensorPageChange(sensorPagination.page - 1)}
									disabled={!sensorPagination.hasPrev}
									className="pagination-btn"
								>
									Previous
								</button>
								<span className="page-info">
									Page {sensorPagination.page} of {sensorPagination.totalPages}
								</span>
								<button
									onClick={() => handleSensorPageChange(sensorPagination.page + 1)}
									disabled={!sensorPagination.hasNext}
									className="pagination-btn"
								>
									Next
								</button>
							</div>
						</>
					)}
				</div>
			) : activeTab === "controls" ? (
				<div className="device-controls-section">
					<div className="section-header">
						<h3>🎮 Device Control History</h3>
						<div className="pagination-info">
							Page {devicePagination.page} of {devicePagination.totalPages}
							({devicePagination.total} total records)
						</div>
					</div>

					{deviceControls.length === 0 ? (
						<div className="no-data">No device control data available for the selected filters.</div>
					) : (
						<>
							<div className="data-table-wrapper">
								<table className="data-table">
									<thead>
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
												<td>{formatDateTime(item.timestamp)}</td>
												<td>{item.deviceType}</td>
												<td>{item.action}</td>
												<td>
													<span className={`status-badge ${item.status ? 'on' : 'off'}`}>
														{item.status ? 'ON' : 'OFF'}
													</span>
												</td>
												<td>
													<span className={`control-type ${item.controlType}`}>
														{item.controlType}
													</span>
												</td>
												<td>{item.triggeredBy || 'N/A'}</td>
												<td>
													<span className={`success-badge ${item.success ? 'success' : 'failed'}`}>
														{item.success ? '✓' : '✗'}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination Controls */}
							<div className="pagination-controls">
								<button
									onClick={() => handleDevicePageChange(devicePagination.page - 1)}
									disabled={!devicePagination.hasPrev}
									className="pagination-btn"
								>
									Previous
								</button>
								<span className="page-info">
									Page {devicePagination.page} of {devicePagination.totalPages}
								</span>
								<button
									onClick={() => handleDevicePageChange(devicePagination.page + 1)}
									disabled={!devicePagination.hasNext}
									className="pagination-btn"
								>
									Next
								</button>
							</div>
						</>
					)}
				</div>
			) : (
				<div className="voice-commands-section">
					<div className="section-header">
						<h3>🎤 Voice Commands History</h3>
						<div className="pagination-info">
							Page {voicePagination.page} of {voicePagination.totalPages}
							({voicePagination.total} total records)
						</div>
					</div>

					{voiceCommands.length === 0 ? (
						<div className="no-data">No voice command data available.</div>
					) : (
						<>
							<div className="data-table-wrapper">
								<table className="data-table">
									<thead>
										<tr>
											<th>Time</th>
											<th>Command</th>
											<th>Confidence</th>
											<th>Status</th>
											<th>Response</th>
										</tr>
									</thead>
									<tbody>
										{voiceCommands.map((command, index) => (
											<tr key={command.id || index}>
												<td>{formatDateTime(command.timestamp)}</td>
												<td>{command.command}</td>
												<td>
													{command.confidence !== null ? (
														<span className={`confidence-badge ${getConfidenceBadge(command.confidence)}`}>
															{(command.confidence * 100).toFixed(1)}%
														</span>
													) : (
														<span className="confidence-badge secondary">N/A</span>
													)}
												</td>
												<td>
													<span className={`status-badge ${getVoiceStatusBadge(command)}`}>
														{command.errorMessage ? 'Error' : command.processed ? 'Processed' : 'Pending'}
													</span>
												</td>
												<td>{command.response || command.errorMessage || 'N/A'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination Controls */}
							<div className="pagination-controls">
								<button
									onClick={() => handleVoicePageChange(voicePagination.page - 1)}
									disabled={!voicePagination.hasPrev}
									className="pagination-btn"
								>
									Previous
								</button>
								<span className="page-info">
									Page {voicePagination.page} of {voicePagination.totalPages}
								</span>
								<button
									onClick={() => handleVoicePageChange(voicePagination.page + 1)}
									disabled={!voicePagination.hasNext}
									className="pagination-btn"
								>
									Next
								</button>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default HistoryPage;
