/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Container, Card, Form, Row, Col, Button } from "react-bootstrap";
import mockDataService, {
	type ChartDataPoint,
	type DeviceControl,
} from "@/services/mockDataService";
import useWebSocket from "@/hooks/useWebSocket";
import styles from "./history.module.scss";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const History = () => {
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
	const { socket, sensorData, persistentSensorData } = useWebSocket();

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
			// Use the backend API URL instead of frontend API route
			const API_BASE_URL =
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
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

	// WebSocket listeners for real-time updates
	useEffect(() => {
		if (socket) {
			// Listen for device control confirmations
			const handleDeviceControl = (controlData: any) => {
				console.log("📱 Received device control confirmation:", controlData);

				// Create a new device control entry
				const newControl: DeviceControl = {
					_id: controlData.controlId || Date.now().toString(),
					deviceId: controlData.deviceType,
					deviceType: controlData.deviceType,
					action: controlData.action,
					status: controlData.status,
					controlType: controlData.source === 'automation' ? 'auto' : 'manual',
					triggeredBy: controlData.source === 'automation' ? 'Automation' : 'Manual control',
					timestamp: controlData.timestamp,
					success: controlData.success
				};

				// Add to the beginning of the device controls list
				setDeviceControls(prev => [newControl, ...prev]);
			};

			// Listen for sensor data updates to add to history
			const handleSensorData = (sensorUpdate: any) => {
				console.log("📊 Received sensor data update:", sensorUpdate);

				// Create new chart data point from sensor update
				if (sensorUpdate.sensor && sensorUpdate.data?.value !== undefined) {
					const newDataPoint: ChartDataPoint = {
						time: sensorUpdate.timestamp || new Date().toISOString(),
						temperature: sensorUpdate.sensor === 'temperature' ? sensorUpdate.data.value : null,
						humidity: sensorUpdate.sensor === 'humidity' ? sensorUpdate.data.value : null,
						soilMoisture: sensorUpdate.sensor === 'soil' ? sensorUpdate.data.value : null,
						waterLevel: sensorUpdate.sensor === 'water' ? sensorUpdate.data.value : null,
						lightLevel: sensorUpdate.sensor === 'light' ? sensorUpdate.data.value : null,
						rainStatus: sensorUpdate.sensor === 'rain' ? sensorUpdate.data.value : null,
						plantHeight: sensorUpdate.sensor === 'height' ? sensorUpdate.data.value : null,
					};

					// Add to the beginning of the data list (limit to prevent memory issues)
					setData(prev => [newDataPoint, ...prev.slice(0, 999)]);
				}
			};

			socket.on('device-control-confirmation', handleDeviceControl);
			socket.on('sensor:data', handleSensorData);
			socket.on('sensor-data', handleSensorData); // Legacy compatibility

			return () => {
				socket.off('device-control-confirmation', handleDeviceControl);
				socket.off('sensor:data', handleSensorData);
				socket.off('sensor-data', handleSensorData);
			};
		}
	}, [socket]);

	// Apply filters when filter state or data changes
	useEffect(() => {
		// Filter data based on date, month, and year
		const applyFilters = () => {
			// Filter sensor data
			let filtered = [...data];

			if (dateFilter) {
				// Filter by specific date (YYYY-MM-DD)
				filtered = filtered.filter((entry) => {
					const entryDate = new Date(entry.time);
					return entryDate.toISOString().split("T")[0] === dateFilter;
				});
			}

			if (monthFilter) {
				// Filter by month (YYYY-MM)
				filtered = filtered.filter((entry) => {
					const entryDate = new Date(entry.time);
					const entryMonth = `${entryDate.getFullYear()}-${String(
						entryDate.getMonth() + 1
					).padStart(2, "0")}`;
					return entryMonth === monthFilter;
				});
			}

			if (yearFilter) {
				// Filter by year (YYYY)
				filtered = filtered.filter((entry) => {
					const entryDate = new Date(entry.time);
					return entryDate.getFullYear().toString() === yearFilter;
				});
			}

			setFilteredData(filtered);

			// Filter device controls
			let filteredControls = [...deviceControls];

			if (dateFilter) {
				filteredControls = filteredControls.filter((control) => {
					const controlDate = new Date(control.timestamp);
					return controlDate.toISOString().split("T")[0] === dateFilter;
				});
			}

			if (monthFilter) {
				filteredControls = filteredControls.filter((control) => {
					const controlDate = new Date(control.timestamp);
					const controlMonth = `${controlDate.getFullYear()}-${String(
						controlDate.getMonth() + 1
					).padStart(2, "0")}`;
					return controlMonth === monthFilter;
				});
			}

			if (yearFilter) {
				// Filter by year (YYYY)
				filteredControls = filteredControls.filter((control) => {
					const controlDate = new Date(control.timestamp);
					return controlDate.getFullYear().toString() === yearFilter;
				});
			}

			setFilteredDeviceControls(filteredControls);
		};

		applyFilters();
	}, [data, deviceControls, dateFilter, monthFilter, yearFilter]);

	// Reset filters
	const resetFilters = () => {
		setDateFilter("");
		setMonthFilter("");
		setYearFilter("");
	};

	// Function to convert data to CSV
	const exportToCSV = async (exportType: "sensors" | "controls") => {
		// Set exporting state
		setIsExporting(true);

		try {
			// Choose data based on tab
			if (exportType === "sensors") {
				// Handle sensor data export
				const dataToExport = filteredData.length > 0 ? filteredData : data;

				if (dataToExport.length === 0) {
					alert("No sensor data available to export");
					setIsExporting(false);
					return;
				}

				// Headers for sensor data
				let csvContent =
					"Time,Temperature (°C),Humidity (%),Soil Moisture,Water Level,Light Level,Rain Status,Plant Height (cm)\n";

				// Data rows for sensors
				dataToExport.forEach((entry: ChartDataPoint) => {
					// Format soil moisture
					const soilMoistureText =
						entry.soilMoisture === 1
							? "Wet"
							: entry.soilMoisture === 0
								? "Dry"
								: "N/A";

					// Format water level
					const waterLevelText =
						entry.waterLevel === 1
							? "Full"
							: entry.waterLevel === 0
								? "None"
								: "N/A";

					// Format light level
					const lightLevelText =
						entry.lightLevel === 1
							? "Bright"
							: entry.lightLevel === 0
								? "Dark"
								: "N/A";

					// Format rain status
					const rainStatusText =
						entry.rainStatus === 1 || entry.rainStatus === true
							? "Raining"
							: entry.rainStatus === 0 || entry.rainStatus === false
								? "No Rain"
								: "N/A";

					// Create CSV row
					csvContent += `"${formatDateTime(entry.time)}",${entry.temperature?.toFixed(1) || "N/A"
						},${entry.humidity?.toFixed(1) || "N/A"
						},"${soilMoistureText}","${waterLevelText}","${lightLevelText}","${rainStatusText}",${entry.plantHeight?.toFixed(1) || "N/A"
						}\n`;
				});

				// Download the CSV file
				downloadCSV(
					csvContent,
					`greenhouse_sensor_history_${new Date().toISOString().split("T")[0]
					}.csv`
				);
			} else {
				// Handle device controls export
				const dataToExport =
					filteredDeviceControls.length > 0
						? filteredDeviceControls
						: deviceControls;

				if (dataToExport.length === 0) {
					alert("No device control data available to export");
					setIsExporting(false);
					return;
				}

				// Headers for device controls
				let csvContent =
					"Time,Device Type,Device ID,Action,Control Type,Trigger,Status\n";

				// Data rows for device controls
				dataToExport.forEach((control: DeviceControl) => {
					// Format control type
					const controlTypeText =
						control.controlType === "auto" ? "AUTO" : "MANUAL";

					// Format status
					const statusText = control.success ? "Success" : "Failed";

					// Create CSV row
					csvContent += `"${formatDateTime(
						control.timestamp
					)}","${control.deviceType.toUpperCase()}","${control.deviceId
						}","${control.action.toUpperCase()}","${controlTypeText}","${control.triggeredBy || ""
						}","${statusText}"\n`;
				});

				// Download the CSV file
				downloadCSV(
					csvContent,
					`greenhouse_controls_history_${new Date().toISOString().split("T")[0]
					}.csv`
				);
			}

			// Add a small delay to give user feedback
			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (error) {
			console.error("Error exporting CSV:", error);
			alert("Failed to export data. Please try again.");
		} finally {
			// Reset exporting state
			setIsExporting(false);
		}
	};

	// Helper function to download CSV
	const downloadCSV = (csvContent: string, filename: string) => {
		// Create a blob and download link
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		// Set attributes and download the file
		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Listen for mock data setting changes
	useEffect(() => {
		const handleMockDataChange = (event: CustomEvent) => {
			console.log(
				"🔧 Mock data setting changed in history:",
				event.detail.enabled
			);

			// Force re-fetch data with new setting
			const fetchData = async () => {
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log("🎭 History switched to mock data");
				} else {
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(result.isMock);
					console.log(
						result.isMock
							? "🎭 History fallback to mock data (API unavailable)"
							: "✅ History switched to real data"
					);
				}

				// Re-fetch device controls
				await fetchDeviceControls();
			};

			fetchData();
		};

		// @ts-ignore
		window.addEventListener("mockDataChanged", handleMockDataChange);

		return () => {
			// @ts-ignore
			window.removeEventListener("mockDataChanged", handleMockDataChange);
		};
	}, []);

	return (
		<Container className={styles.historyContainer}>
			<h3 className={styles.heading}>Let&apos;s explore your Cloud history</h3>
			<div
				className={`alert ${isUsingMockData ? "alert-warning" : "alert-success"
					} ${styles.alertBanner}`}
			>
				{isUsingMockData
					? "🎭 Using mock data for development"
					: "📊 Using production data"}
			</div>

			{/* Enhanced Filter Controls */}
			<Card className={`${styles.filterCard} shadow-sm border-0`}>
				<Card.Header className={styles.filterHeader}>
					<div className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center">
							<i className="bi bi-funnel me-2"></i>
							<h5 className="mb-0">Data Filters</h5>
						</div>
						{(dateFilter || monthFilter || yearFilter) && (
							<small className="text-white opacity-75">
								{activeTab === "sensors"
									? `Showing ${filteredData.length} of ${data.length} sensor records`
									: `Showing ${filteredDeviceControls.length} of ${deviceControls.length} device control records`}
							</small>
						)}
					</div>
				</Card.Header>
				<Card.Body className={styles.filterBody}>

					<Row className="g-3">
						{/* Date Filter */}
						<Col md={3}>
							<Form.Group>
								<Form.Label className={styles.filterLabel}>
									<i className="bi bi-calendar-date"></i>
									Specific Date
								</Form.Label>
								<Form.Control
									type="date"
									value={dateFilter}
									onChange={(e) => setDateFilter(e.target.value)}
									className={styles.filterInput}
								/>
								<Form.Text className={styles.filterText}>
									Filter by exact date
								</Form.Text>
							</Form.Group>
						</Col>

						{/* Month Filter */}
						<Col md={3}>
							<Form.Group>
								<Form.Label className={styles.filterLabel}>
									<i className="bi bi-calendar-month"></i>
									Month
								</Form.Label>
								<Form.Select
									value={monthFilter}
									onChange={(e) => setMonthFilter(e.target.value)}
									className={styles.filterInput}
								>
									<option value="">All Months</option>
									{Array.from({ length: 12 }, (_, i) => {
										const currentYear = new Date().getFullYear();
										const monthValue = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
										const monthName = new Date(currentYear, i).toLocaleDateString('en-US', { month: 'long' });
										return (
											<option key={i + 1} value={monthValue}>
												{monthName} {currentYear}
											</option>
										);
									})}
									{/* Previous year months if needed */}
									{Array.from({ length: 12 }, (_, i) => {
										const previousYear = new Date().getFullYear() - 1;
										const monthValue = `${previousYear}-${String(i + 1).padStart(2, '0')}`;
										const monthName = new Date(previousYear, i).toLocaleDateString('en-US', { month: 'long' });
										return (
											<option key={`prev-${i + 1}`} value={monthValue}>
												{monthName} {previousYear}
											</option>
										);
									})}
								</Form.Select>
								<Form.Text className={styles.filterText}>
									Filter by month
								</Form.Text>
							</Form.Group>
						</Col>

						{/* Year Filter */}
						<Col md={3}>
							<Form.Group>
								<Form.Label className={styles.filterLabel}>
									<i className="bi bi-calendar-year"></i>
									Year
								</Form.Label>
								<Form.Select
									value={yearFilter}
									onChange={(e) => setYearFilter(e.target.value)}
									className={styles.filterInput}
								>
									<option value="">All Years</option>
									{Array.from(
										{ length: 6 },
										(_, i) => new Date().getFullYear() - i
									).map((year) => (
										<option key={year} value={year.toString()}>
											{year}
										</option>
									))}
								</Form.Select>
								<Form.Text className={styles.filterText}>
									Filter by year
								</Form.Text>
							</Form.Group>
						</Col>

						{/* Action Buttons */}
						<Col md={3}>
							<Form.Label className={styles.filterLabel}>
								<i className="bi bi-gear"></i>
								Actions
							</Form.Label>
							<div className="d-flex gap-2 flex-column">
								<button
									className={`${styles.actionButton} ${styles.clearButton}`}
									onClick={resetFilters}
									disabled={!dateFilter && !monthFilter && !yearFilter}
									type="button"
								>
									<i className="bi bi-x-circle"></i>
									Clear Filters
								</button>
								<button
									className={`${styles.actionButton} ${styles.exportButton}`}
									onClick={() => exportToCSV(activeTab)}
									disabled={isExporting}
									type="button"
								>
									{isExporting ? (
										<>
											<span className="spinner-border spinner-border-sm" />
											Exporting...
										</>
									) : (
										<>
											<i className="bi bi-download"></i>
											Export CSV
										</>
									)}
								</button>
							</div>
						</Col>
					</Row>

					{/* Filter Summary */}
					{(dateFilter || monthFilter || yearFilter) && (
						<Row className="mt-3">
							<Col>
								<div className={styles.filterSummary}>
									<small className="fw-semibold text-dark">
										<i className="bi bi-info-circle me-1"></i>
										Active Filters:
									</small>
									<div className="d-flex gap-2 flex-wrap mt-1">
										{dateFilter && (
											<span className={styles.filterBadge}>
												Date: {dateFilter}
												<button
													className="btn-close btn-close-white ms-1"
													style={{ fontSize: '10px' }}
													onClick={() => setDateFilter("")}
													type="button"
												></button>
											</span>
										)}
										{monthFilter && (
											<span className={styles.filterBadge}>
												Month: {new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
												<button
													className="btn-close btn-close-white ms-1"
													style={{ fontSize: '10px' }}
													onClick={() => setMonthFilter("")}
													type="button"
												></button>
											</span>
										)}
										{yearFilter && (
											<span className={styles.filterBadge}>
												Year: {yearFilter}
												<button
													className="btn-close btn-close-white ms-1"
													style={{ fontSize: '10px' }}
													onClick={() => setYearFilter("")}
													type="button"
												></button>
											</span>
										)}
									</div>
								</div>
							</Col>
						</Row>
					)}
				</Card.Body>
			</Card>

			{/* Tab Navigation */}
			<div className="mb-4">
				<ul className="nav nav-tabs">
					<li className="nav-item">
						<button
							className={`nav-link ${activeTab === "sensors" ? "active" : ""}`}
							onClick={() => setActiveTab("sensors")}
							type="button"
						>
							📊 Sensor Data
						</button>
					</li>
					<li className="nav-item">
						<button
							className={`nav-link ${activeTab === "controls" ? "active" : ""}`}
							onClick={() => setActiveTab("controls")}
							type="button"
						>
							🎛️ Device Controls
						</button>
					</li>
				</ul>
			</div>

			{isLoading ? (
				<p className={styles.statusMessage}>Loading data...</p>
			) : activeTab === "sensors" ? (
				// Sensor Data Tab
				filteredData.length === 0 ? (
					<p className={styles.statusMessage}>
						{data.length === 0
							? "No sensor data available"
							: "No matching records for the selected filters"}
					</p>
				) : (
					filteredData.map((entry: ChartDataPoint, index: number) => (
						<Card key={index} className={styles.historyCard}>
							<Card.Body>
								<p className={styles.timeStamp}>
									<b>Time:</b> {formatDateTime(entry.time)}
								</p>
								<p className={styles.sensorData}>
									<span className={styles.sensorItem}>
										<b>Temperature:</b> {entry.temperature?.toFixed(1) || "N/A"}
										°C
									</span>
									<span className={styles.sensorItem}>
										<b>Humidity:</b> {entry.humidity?.toFixed(1) || "N/A"}%
									</span>
									<span className={styles.sensorItem}>
										<b>Soil Moisture:</b>{" "}
										{entry.soilMoisture === 1
											? "💧 Wet"
											: entry.soilMoisture === 0
												? "🌵 Dry"
												: "N/A"}
									</span>
									<span className={styles.sensorItem}>
										<b>Water Level:</b>{" "}
										{entry.waterLevel === 1
											? "🌊 Full"
											: entry.waterLevel === 0
												? "❌ None"
												: "N/A"}
									</span>
									<span className={styles.sensorItem}>
										<b>Light Level:</b>{" "}
										{entry.lightLevel === 1
											? "☀️ Bright"
											: entry.lightLevel === 0
												? "🌙 Dark"
												: "N/A"}
									</span>
									<span className={styles.sensorItem}>
										<b>Rain Status:</b>{" "}
										{entry.rainStatus === 1 || entry.rainStatus === true
											? "🌧️ Raining"
											: entry.rainStatus === 0 || entry.rainStatus === false
												? "☀️ No Rain"
												: "N/A"}
									</span>
									<span className={styles.sensorItem}>
										<b>Plant Height:</b>{" "}
										{entry.plantHeight?.toFixed(1) || "N/A"}cm
									</span>
								</p>
							</Card.Body>
						</Card>
					))
				)
			) : // Device Controls Tab
				filteredDeviceControls.length === 0 ? (
					<p className={styles.statusMessage}>
						{deviceControls.length === 0
							? "No device control history available"
							: "No matching records for the selected filters"}
					</p>
				) : (
					filteredDeviceControls.map((control: DeviceControl, index: number) => (
						<Card key={index} className={styles.historyCard}>
							<Card.Body>
								<p className={styles.timeStamp}>
									<b>Time:</b> {formatDateTime(control.timestamp)}
								</p>
								<p className={styles.sensorData}>
									<span className={styles.sensorItem}>
										<b>Device:</b> {control.deviceType.toUpperCase()} (
										{control.deviceId})
									</span>
									<span className={styles.sensorItem}>
										<b>Action:</b> {control.action.toUpperCase()}
									</span>
									<span className={styles.sensorItem}>
										<b>Control Type:</b>
										<span
											className={
												control.controlType === "auto"
													? "text-info"
													: "text-warning"
											}
										>
											{control.controlType === "auto" ? " 🤖 AUTO" : " 👤 MANUAL"}
										</span>
									</span>
									{control.triggeredBy && (
										<span className={styles.sensorItem}>
											<b>Trigger:</b> {control.triggeredBy}
										</span>
									)}
									<span className={styles.sensorItem}>
										<b>Status:</b>
										<span
											className={control.success ? "text-success" : "text-danger"}
										>
											{control.success ? " ✅ Success" : " ❌ Failed"}
										</span>
									</span>
								</p>
							</Card.Body>
						</Card>
					))
				)}
		</Container>
	);
};

export default History;
