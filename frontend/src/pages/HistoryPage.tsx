import { useEffect, useState } from "react";
import mockDataService, {
	type ChartDataPoint,
	type DeviceControl,
} from "@/services/mockDataService";
// import useWebSocket from "@/hooks/useWebSocket"; // Currently not used
import "./HistoryPage.css";

const HistoryPage = () => {
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([]);
	const [deviceControls, setDeviceControls] = useState<DeviceControl[]>([]);
	const [filteredDeviceControls, setFilteredDeviceControls] = useState<
		DeviceControl[]
	>([]);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"sensors" | "controls">("sensors");
	const [dateFilter, setDateFilter] = useState("");
	const [monthFilter, setMonthFilter] = useState("");
	const [yearFilter, setYearFilter] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	// WebSocket integration for real-time updates
	// const { socket } = useWebSocket(); // Currently not used, can be uncommented if needed

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

	// Fetch device control history
	const fetchDeviceControls = async () => {
		try {
			const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
			const response = await fetch(
				`${API_BASE_URL}/api/history/device-controls`
			);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setDeviceControls(result.data.controls || []);
				}
			} else {
				console.warn(
					"Device controls API response not ok:",
					response.status,
					response.statusText
				);
			}
		} catch (error) {
			console.error("Failed to fetch device controls:", error);
			// Mock device controls for development
			setDeviceControls([
				{
					_id: "1",
					deviceId: "pump-01",
					deviceType: "pump",
					action: "on",
					status: true,
					controlType: "auto",
					triggeredBy: "Soil moisture = 0 (dry)",
					timestamp: new Date(Date.now() - 3600000).toISOString(),
					success: true,
				},
				{
					_id: "2",
					deviceId: "light-01",
					deviceType: "light",
					action: "off",
					status: false,
					controlType: "manual",
					userId: "user123",
					timestamp: new Date(Date.now() - 7200000).toISOString(),
					success: true,
				},
			]);
		}
	};

	// Fetch data when component is mounted
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Check if mock data is enabled in settings
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					// Use mock data
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log("🎭 Using mock history data (enabled in settings)");
				} else {
					// Try to get real data from API
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(result.isMock);
					console.log(
						result.isMock
							? "🎭 Fallback to mock data (API unavailable)"
							: "✅ Using real history data from API"
					);
				}

				// Fetch device controls
				await fetchDeviceControls();

				setIsLoading(false);
			} catch (error) {
				console.error("Failed to fetch history data:", error);
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// Apply filters to sensor data
	useEffect(() => {
		let filtered = [...data];

		if (dateFilter) {
			filtered = filtered.filter((item) => {
				const itemDate = new Date(item.time).toISOString().split("T")[0];
				return itemDate === dateFilter;
			});
		}

		if (monthFilter) {
			filtered = filtered.filter((item) => {
				const itemMonth = new Date(item.time).toISOString().slice(0, 7);
				return itemMonth === monthFilter;
			});
		}

		if (yearFilter) {
			filtered = filtered.filter((item) => {
				const itemYear = new Date(item.time).getFullYear().toString();
				return itemYear === yearFilter;
			});
		}

		setFilteredData(filtered);
	}, [data, dateFilter, monthFilter, yearFilter]);

	// Apply filters to device controls
	useEffect(() => {
		let filtered = [...deviceControls];

		if (dateFilter) {
			filtered = filtered.filter((item) => {
				const itemDate = new Date(item.timestamp).toISOString().split("T")[0];
				return itemDate === dateFilter;
			});
		}

		if (monthFilter) {
			filtered = filtered.filter((item) => {
				const itemMonth = new Date(item.timestamp).toISOString().slice(0, 7);
				return itemMonth === monthFilter;
			});
		}

		if (yearFilter) {
			filtered = filtered.filter((item) => {
				const itemYear = new Date(item.timestamp).getFullYear().toString();
				return itemYear === yearFilter;
			});
		}

		setFilteredDeviceControls(filtered);
	}, [deviceControls, dateFilter, monthFilter, yearFilter]);

	const exportToCSV = () => {
		setIsExporting(true);

		try {
			if (activeTab === "sensors") {
				const csvData = filteredData.map(item => ({
					Time: formatDateTime(item.time),
					Temperature: item.temperature || 'N/A',
					Humidity: item.humidity || 'N/A',
					SoilMoisture: item.soilMoisture || 'N/A',
					WaterLevel: item.waterLevel || 'N/A',
					LightLevel: item.lightLevel || 'N/A',
					RainStatus: item.rainStatus || 'N/A',
					PlantHeight: item.plantHeight || 'N/A'
				}));

				const headers = Object.keys(csvData[0] || {}).join(',');
				const rows = csvData.map(row => Object.values(row).join(','));
				const csvContent = [headers, ...rows].join('\n');

				const blob = new Blob([csvContent], { type: 'text/csv' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.style.display = 'none';
				a.href = url;
				a.download = `sensor-history-${new Date().toISOString().split('T')[0]}.csv`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				const csvData = filteredDeviceControls.map(item => ({
					Time: formatDateTime(item.timestamp),
					DeviceType: item.deviceType,
					Action: item.action,
					Status: item.status ? 'ON' : 'OFF',
					ControlType: item.controlType,
					TriggeredBy: item.triggeredBy || 'N/A',
					Success: item.success ? 'Yes' : 'No'
				}));

				const headers = Object.keys(csvData[0] || {}).join(',');
				const rows = csvData.map(row => Object.values(row).join(','));
				const csvContent = [headers, ...rows].join('\n');

				const blob = new Blob([csvContent], { type: 'text/csv' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.style.display = 'none';
				a.href = url;
				a.download = `device-controls-history-${new Date().toISOString().split('T')[0]}.csv`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error("Export failed:", error);
		} finally {
			setIsExporting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="history-loading">
				<div>Loading history data...</div>
			</div>
		);
	}

	return (
		<div className="history-container">
			<div className="history-header">
				<h1>Data History</h1>
				{isUsingMockData && (
					<div className="mock-data-badge">
						🎭 Mock Data Mode
					</div>
				)}
			</div>

			{/* Tab Navigation */}
			<div className="tab-navigation">
				<button
					className={`tab-button ${activeTab === "sensors" ? "active" : ""}`}
					onClick={() => setActiveTab("sensors")}
				>
					📊 Sensor Data
				</button>
				<button
					className={`tab-button ${activeTab === "controls" ? "active" : ""}`}
					onClick={() => setActiveTab("controls")}
				>
					🎛️ Device Controls
				</button>
			</div>

			{/* Filters */}
			<div className="filters-section">
				<div className="filter-group">
					<label>Filter by Date:</label>
					<input
						type="date"
						value={dateFilter}
						onChange={(e) => setDateFilter(e.target.value)}
						className="filter-input"
					/>
				</div>
				<div className="filter-group">
					<label>Filter by Month:</label>
					<input
						type="month"
						value={monthFilter}
						onChange={(e) => setMonthFilter(e.target.value)}
						className="filter-input"
					/>
				</div>
				<div className="filter-group">
					<label>Filter by Year:</label>
					<input
						type="number"
						value={yearFilter}
						onChange={(e) => setYearFilter(e.target.value)}
						placeholder="YYYY"
						min="2020"
						max="2030"
						className="filter-input"
					/>
				</div>
				<button
					onClick={() => {
						setDateFilter("");
						setMonthFilter("");
						setYearFilter("");
					}}
					className="clear-filters-btn"
				>
					Clear Filters
				</button>
				<button
					onClick={exportToCSV}
					disabled={isExporting}
					className="export-btn"
				>
					{isExporting ? "Exporting..." : "Export CSV"}
				</button>
			</div>

			{/* Content */}
			{activeTab === "sensors" ? (
				<div className="sensor-data-section">
					<h3>Sensor Data History ({filteredData.length} records)</h3>
					{filteredData.length === 0 ? (
						<div className="no-data">No sensor data available for the selected filters.</div>
					) : (
						<div className="data-table-wrapper">
							<table className="data-table">
								<thead>
									<tr>
										<th>Time</th>
										<th>Temperature (°C)</th>
										<th>Humidity (%)</th>
										<th>Soil Moisture</th>
										<th>Water Level</th>
										<th>Light Level</th>
										<th>Rain Status</th>
										<th>Plant Height (cm)</th>
									</tr>
								</thead>
								<tbody>
									{filteredData.slice(0, 100).map((item, index) => (
										<tr key={index}>
											<td>{formatDateTime(item.time)}</td>
											<td>{item.temperature?.toFixed(1) || "N/A"}</td>
											<td>{item.humidity?.toFixed(1) || "N/A"}</td>
											<td>{item.soilMoisture !== null ? (item.soilMoisture ? "Wet" : "Dry") : "N/A"}</td>
											<td>{item.waterLevel !== null ? (item.waterLevel ? "Full" : "Empty") : "N/A"}</td>
											<td>{item.lightLevel !== null ? (item.lightLevel ? "Bright" : "Dark") : "N/A"}</td>
											<td>{item.rainStatus !== null ? (item.rainStatus ? "Raining" : "No Rain") : "N/A"}</td>
											<td>{item.plantHeight?.toFixed(1) || "N/A"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			) : (
				<div className="device-controls-section">
					<h3>Device Control History ({filteredDeviceControls.length} records)</h3>
					{filteredDeviceControls.length === 0 ? (
						<div className="no-data">No device control data available for the selected filters.</div>
					) : (
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
									{filteredDeviceControls.slice(0, 100).map((item, index) => (
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
					)}
				</div>
			)}
		</div>
	);
};

export default HistoryPage;
