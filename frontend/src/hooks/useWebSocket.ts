import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getWebSocketUrl, getWebSocketConfig, logConnectionInfo } from "@/lib/websocketConfig";
import deviceControlService, { DeviceControlRequest } from "@/services/deviceControlService";

interface SensorData {
	sensor: string;
	data: any;
	timestamp: string;
	topic?: string;
	value?: number; // For backward compatibility
}

interface PersistentSensorState {
	temperature: { value: number; timestamp: string } | null;
	humidity: { value: number; timestamp: string } | null;
	soil: { value: number; timestamp: string } | null;
	water: { value: number; timestamp: string } | null;
	light: { value: number; timestamp: string } | null;
	rain: { value: number; timestamp: string } | null;
	height: { value: number; timestamp: string } | null;
}

interface DeviceStatus {
	device: string;
	status: any;
	timestamp: string;
}

interface Alert {
	id: string;
	type: string;
	message: string;
	severity: 'low' | 'medium' | 'high';
	timestamp: string;
}

interface UseWebSocketReturn {
	socket: Socket | null;
	isConnected: boolean;
	sensorData: SensorData | null;
	persistentSensorData: PersistentSensorState;
	deviceStatus: DeviceStatus | null;
	alerts: Alert[];
	sendDeviceControl: (deviceType: string, action: string) => Promise<any>;
	clearAlerts: () => void;
	// Enhanced state synchronization
	deviceStates: any;
	automationSettings: any;
	thresholdSettings: any;
	emailSettings: any;
	userSettings: any;
}

export default function useWebSocket(): UseWebSocketReturn {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [sensorData, setSensorData] = useState<SensorData | null>(null);
	const [persistentSensorData, setPersistentSensorData] = useState<PersistentSensorState>({
		temperature: null,
		humidity: null,
		soil: null,
		water: null,
		light: null,
		rain: null,
		height: null
	});
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
	const [alerts, setAlerts] = useState<Alert[]>([]);

	// Enhanced state synchronization
	const [deviceStates, setDeviceStates] = useState<any>({});
	const [automationSettings, setAutomationSettings] = useState<any>({});
	const [thresholdSettings, setThresholdSettings] = useState<any>({});
	const [emailSettings, setEmailSettings] = useState<any>({});
	const [userSettings, setUserSettings] = useState<any>({});

	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

	// Use requestAnimationFrame to prevent UI blocking
	const updateSensorData = useCallback((data: any) => {
		requestAnimationFrame(() => {
			// Normalize sensor data format to handle service.backup format:
			// Service.backup format: { topic, sensor, data: { value, timestamp, quality, merged }, timestamp }
			// Legacy format: { sensor, data, timestamp, value }

			let normalizedData: SensorData;

			if (data.sensor && data.data && typeof data.data === 'object' && data.data.value !== undefined) {
				// New service.backup format
				normalizedData = {
					sensor: data.sensor,
					data: data.data,
					timestamp: data.timestamp || new Date().toISOString(),
					topic: data.topic,
					value: data.data.value
				};
			} else if (data.type && data.value !== undefined) {
				// Direct backend format from MQTT handler
				normalizedData = {
					sensor: data.type,
					data: { value: data.value, quality: data.quality || 'good' },
					timestamp: data.timestamp || new Date().toISOString(),
					topic: data.topic,
					value: data.value
				};
			} else {
				// Legacy format or unknown format
				normalizedData = {
					sensor: data.sensor || data.type || 'unknown',
					data: data.data || data,
					timestamp: data.timestamp || new Date().toISOString(),
					topic: data.topic,
					value: data.value || (typeof data.data === 'number' ? data.data : 0)
				};
			}

			setSensorData(normalizedData);

			// Update persistent sensor state with the extracted value
			const value = normalizedData.value;

			if (value !== undefined && !isNaN(value)) {
				setPersistentSensorData(prev => ({
					...prev,
					[normalizedData.sensor]: {
						value,
						timestamp: normalizedData.timestamp
					}
				}));

			} else {
				// Handle invalid/unexpected data format
			}
		});
	}, []);

	const updateDeviceStatus = useCallback((status: DeviceStatus) => {
		requestAnimationFrame(() => {
			setDeviceStatus(status);
		});
	}, []);

	const updateAlerts = useCallback((alert: Alert) => {
		requestAnimationFrame(() => {
			setAlerts(prev => [alert, ...prev].slice(0, 50));
		});
	}, []);

	useEffect(() => {
		// Get server URL and configuration
		const serverUrl = getWebSocketUrl();
		const config = getWebSocketConfig();

		// Log connection information for debugging
		logConnectionInfo(serverUrl);

		const newSocket = io(serverUrl, config);

		// Try to connect
		newSocket.connect();

		// Connection events
		newSocket.on('connect', () => {
			setIsConnected(true);

			// Subscribe to sensor data
			newSocket.emit('sensors:subscribe');

			// Clear any existing reconnect timeout
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		});

		newSocket.on('disconnect', (reason) => {
			setIsConnected(false);

			// Attempt to reconnect after a delay if not manually disconnected
			if (reason !== 'io client disconnect') {
				reconnectTimeoutRef.current = setTimeout(() => {
					newSocket.connect();
				}, 3000);
			}
		});

		newSocket.on('connect_error', (error) => {
			console.warn('⚠️ WebSocket connection error (server may not be running):', error.message);
			setIsConnected(false);

			// Don't spam error logs, just warn once per connection attempt
			if (!newSocket.recovered) {
				// Connection error handled
			}
		});

		newSocket.on('reconnect_error', (error) => {
			console.warn('⚠️ WebSocket reconnection failed:', error.message);
		});

		newSocket.on('reconnect_failed', () => {
			// Longer delay before trying again
			setTimeout(() => {
				newSocket.connect();
			}, 10000);
		});

		// Data events - Use callbacks to prevent UI blocking
		newSocket.on('sensor:data', updateSensorData);
		newSocket.on('sensor-data', updateSensorData); // Legacy compatibility

		// Individual sensor channels (service.backup format)
		newSocket.on('sensor:temperature', updateSensorData);
		newSocket.on('sensor:humidity', updateSensorData);
		newSocket.on('sensor:soil', updateSensorData);
		newSocket.on('sensor:water', updateSensorData);
		newSocket.on('sensor:light', updateSensorData);
		newSocket.on('sensor:height', updateSensorData);
		newSocket.on('sensor:rain', updateSensorData);

		// Legacy individual sensor channels
		newSocket.on('sensor-temperature', updateSensorData);
		newSocket.on('sensor-humidity', updateSensorData);
		newSocket.on('sensor-soil', updateSensorData);
		newSocket.on('sensor-water', updateSensorData);
		newSocket.on('sensor-light', updateSensorData);
		newSocket.on('sensor-height', updateSensorData);
		newSocket.on('sensor-rain', updateSensorData);

		// Standardized device events
		newSocket.on('device:status', updateDeviceStatus);
		newSocket.on('device-status', updateDeviceStatus); // Legacy compatibility

		// Device state update listeners for new state management
		newSocket.on('device:state:update', (stateData: any) => {
			updateDeviceStatus(stateData);
		});

		// Individual device state listeners
		['light', 'pump', 'door', 'window'].forEach(deviceType => {
			newSocket.on(`device:${deviceType}:state`, (stateData: any) => {
				updateDeviceStatus(stateData);
			});
		});

		// Device control confirmations
		newSocket.on('device:control', (_controlData: any) => {
			// Device control confirmation received
		});

		// Standardized alerts
		newSocket.on('alert:new', updateAlerts);
		newSocket.on('alert', updateAlerts); // Legacy compatibility

		// Additional service.backup channels
		newSocket.on('device-control-confirmation', (_controlData: any) => {
			// Device control confirmation received
		});

		newSocket.on('voice-command', (_voiceData: any) => {
			// Voice command received
		});

		newSocket.on('voice-command-history', (_voiceData: any) => {
			// Voice command history update received
		});

		newSocket.on('automation-status', (_automationData: any) => {
			// Automation status update received
		});

		newSocket.on('automation-status-update', (_automationData: any) => {
			// Automation status detailed update received
		});

		newSocket.on('system-status', (_systemData: any) => {
			// System status update received
		});

		newSocket.on('config-update', (_configData: any) => {
			// Configuration update received
		});

		newSocket.on('priority-alert', (alertData: any) => {
			updateAlerts(alertData);
		});

		newSocket.on('heartbeat', (_heartbeatData: any) => {
			// Heartbeat received
		});

		newSocket.on('connection-status', (_statusData: any) => {
			// Connection status update received
		});

		newSocket.on('notification', (_notification: any) => {
			// Handle notifications here (could show toast, etc.)
		});

		// Enhanced state synchronization listeners
		newSocket.on('device:state:sync', (data: any) => {
			setDeviceStates(data.data?.states || data.states);
		});

		newSocket.on('device:state:update', (data: any) => {
			const stateData = data.data || data;
			setDeviceStates((prev: any) => ({
				...prev,
				[stateData.deviceType]: stateData
			}));
		});

		newSocket.on('automation:settings-update', (data: any) => {
			setAutomationSettings(data.settings);
		});

		newSocket.on('settings:threshold-update', (data: any) => {
			setThresholdSettings(data.thresholds);
		});

		newSocket.on('settings:email-update', (data: any) => {
			setEmailSettings(data.settings);
		});

		newSocket.on('user:settings-update', (data: any) => {
			setUserSettings(data.settings);
		});

		newSocket.on('system:config-update', (_data: any) => {
			// Could be used for global configuration updates
		});

		newSocket.on('database:change', (_data: any) => {
			// Real-time database synchronization
		});

		newSocket.on('connection:health', (_data: any) => {
			// Connection monitoring and health status
		});

		setSocket(newSocket);

		// Teardown function
		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			newSocket.close();
		};
	}, [updateSensorData, updateDeviceStatus, updateAlerts]); // Stable dependencies

	// Function to send device control commands via API only
	const sendDeviceControl = useCallback(async (
		deviceType: string,
		action: string
	): Promise<any> => {
		try {
			const request: DeviceControlRequest = {
				deviceType: deviceType as any,
				action: action as any
			};

			const result = await deviceControlService.sendDeviceControl(request);
			return result;
		} catch (error) {
			throw error;
		}
	}, []);

	// Function to clear alerts
	const clearAlerts = useCallback(() => {
		setAlerts([]);
	}, []);

	return {
		socket,
		isConnected,
		sensorData,
		persistentSensorData,
		deviceStatus,
		alerts,
		sendDeviceControl,
		clearAlerts,
		// Enhanced state synchronization
		deviceStates,
		automationSettings,
		thresholdSettings,
		emailSettings,
		userSettings
	};
}
