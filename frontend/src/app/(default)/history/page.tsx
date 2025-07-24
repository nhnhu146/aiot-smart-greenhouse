/* eslint-disable react-hooks/exhaustive-deps */
'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import mockDataService, { type ChartDataPoint, type DeviceControl } from '@/services/mockDataService';
import styles from './history.module.scss';

const History = () => {
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [deviceControls, setDeviceControls] = useState<DeviceControl[]>([]);
	const [isUsingMockData, setIsUsingMockData] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'sensors' | 'controls'>('sensors');

	// Format timestamp to display date-time consistently
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);

		// Check if it's a valid date
		if (isNaN(date.getTime())) {
			// If it's already a formatted string, return as is
			return timestamp;
		}

		// Format as dd/mm/yyyy hh:mm:ss
		return date.toLocaleString('en-GB', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	};

	// Fetch device control history
	const fetchDeviceControls = async () => {
		try {
			// Use the backend API URL instead of frontend API route
			const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
			const response = await fetch(`${API_BASE_URL}/api/history/device-controls`);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setDeviceControls(result.data.controls || []);
				}
			} else {
				console.warn('Device controls API response not ok:', response.status, response.statusText);
			}
		} catch (error) {
			console.error('Failed to fetch device controls:', error);
			// Mock device controls for development
			setDeviceControls([
				{
					_id: '1',
					deviceId: 'pump-01',
					deviceType: 'pump',
					action: 'on',
					status: true,
					controlType: 'auto',
					triggeredBy: 'Soil moisture = 0 (dry)',
					timestamp: new Date(Date.now() - 3600000).toISOString(),
					success: true
				},
				{
					_id: '2',
					deviceId: 'light-01',
					deviceType: 'light',
					action: 'off',
					status: false,
					controlType: 'manual',
					userId: 'user123',
					timestamp: new Date(Date.now() - 7200000).toISOString(),
					success: true
				}
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
					console.log('🎭 Using mock history data (enabled in settings)');
				} else {
					// Try to get real data from API
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(result.isMock);
					console.log(result.isMock ? '🎭 Fallback to mock data (API unavailable)' : '✅ Using real history data from API');
				}

				// Fetch device controls
				await fetchDeviceControls();

				setIsLoading(false);
			} catch (error) {
				console.error('Failed to fetch history data:', error);
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// Listen for mock data setting changes
	useEffect(() => {
		const handleMockDataChange = (event: CustomEvent) => {
			console.log('🔧 Mock data setting changed in history:', event.detail.enabled);

			// Force re-fetch data with new setting
			const fetchData = async () => {
				const isUsingMock = mockDataService.isUsingMockData();

				if (isUsingMock) {
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(true);
					console.log('🎭 History switched to mock data');
				} else {
					const result = await mockDataService.getChartData();
					setData(result.data);
					setIsUsingMockData(result.isMock);
					console.log(result.isMock ? '🎭 History fallback to mock data (API unavailable)' : '✅ History switched to real data');
				}

				// Re-fetch device controls
				await fetchDeviceControls();
			};

			fetchData();
		};

		// @ts-ignore
		window.addEventListener('mockDataChanged', handleMockDataChange);

		return () => {
			// @ts-ignore
			window.removeEventListener('mockDataChanged', handleMockDataChange);
		};
	}, []);

	return (
		<Container className={styles.historyContainer}>
			<h3 className={styles.heading}>Let&apos;s explore your Cloud history</h3>
			<div className={`alert ${isUsingMockData ? 'alert-warning' : 'alert-success'} ${styles.alertBanner}`}>
				{isUsingMockData
					? '🎭 Using mock data for development'
					: '📊 Using production data'
				}
			</div>

			{/* Tab Navigation */}
			<div className="mb-4">
				<ul className="nav nav-tabs">
					<li className="nav-item">
						<button
							className={`nav-link ${activeTab === 'sensors' ? 'active' : ''}`}
							onClick={() => setActiveTab('sensors')}
							type="button"
						>
							📊 Sensor Data
						</button>
					</li>
					<li className="nav-item">
						<button
							className={`nav-link ${activeTab === 'controls' ? 'active' : ''}`}
							onClick={() => setActiveTab('controls')}
							type="button"
						>
							🎛️ Device Controls
						</button>
					</li>
				</ul>
			</div>

			{isLoading ? (
				<p className={styles.statusMessage}>Loading data...</p>
			) : activeTab === 'sensors' ? (
				// Sensor Data Tab
				data.length === 0 ? (
					<p className={styles.statusMessage}>No sensor data available</p>
				) : (
					data.map((entry: ChartDataPoint, index: number) => (
						<Card
							key={index}
							className={styles.historyCard}
						>
							<Card.Body>
								<p className={styles.timeStamp}><b>Time:</b> {formatDateTime(entry.time)}</p>
								<p className={styles.sensorData}>
									<span className={styles.sensorItem}><b>Temperature:</b> {entry.temperature?.toFixed(1) || 'N/A'}°C</span>
									<span className={styles.sensorItem}><b>Humidity:</b> {entry.humidity?.toFixed(1) || 'N/A'}%</span>
									<span className={styles.sensorItem}><b>Soil Moisture:</b> {
										entry.soilMoisture === 1 ? 'Wet' :
											entry.soilMoisture === 0 ? 'Dry' :
												'N/A'
									}</span>
									<span className={styles.sensorItem}><b>Water Level:</b> {
										entry.waterLevel === 1 ? '🌊 Flooded' :
											entry.waterLevel === 0 ? '✅ Normal' :
												'N/A'
									}</span>
									<span className={styles.sensorItem}><b>Light Level:</b> {
										entry.lightLevel === 1 ? '☀️ Bright' :
											entry.lightLevel === 0 ? '🌙 Dark' :
												'N/A'
									}</span>
									<span className={styles.sensorItem}><b>Rain Status:</b> {
										entry.rainStatus === true ? '🌧️ Raining' :
											entry.rainStatus === false ? '☀️ No Rain' :
												'N/A'
									}</span>
									<span className={styles.sensorItem}><b>Plant Height:</b> {entry.plantHeight?.toFixed(1) || 'N/A'}cm</span>
								</p>
							</Card.Body>
						</Card>
					))
				)
			) : (
				// Device Controls Tab
				deviceControls.length === 0 ? (
					<p className={styles.statusMessage}>No device control history available</p>
				) : (
					deviceControls.map((control: DeviceControl, index: number) => (
						<Card
							key={index}
							className={styles.historyCard}
						>
							<Card.Body>
								<p className={styles.timeStamp}><b>Time:</b> {formatDateTime(control.timestamp)}</p>
								<p className={styles.sensorData}>
									<span className={styles.sensorItem}>
										<b>Device:</b> {control.deviceType.toUpperCase()} ({control.deviceId})
									</span>
									<span className={styles.sensorItem}>
										<b>Action:</b> {control.action.toUpperCase()}
									</span>
									<span className={styles.sensorItem}>
										<b>Control Type:</b>
										<span className={control.controlType === 'auto' ? 'text-info' : 'text-warning'}>
											{control.controlType === 'auto' ? ' 🤖 AUTO' : ' 👤 MANUAL'}
										</span>
									</span>
									{control.triggeredBy && (
										<span className={styles.sensorItem}>
											<b>Trigger:</b> {control.triggeredBy}
										</span>
									)}
									<span className={styles.sensorItem}>
										<b>Status:</b>
										<span className={control.success ? 'text-success' : 'text-danger'}>
											{control.success ? ' ✅ Success' : ' ❌ Failed'}
										</span>
									</span>
								</p>
							</Card.Body>
						</Card>
					))
				)
			)}
		</Container>
	);
};

export default History;
