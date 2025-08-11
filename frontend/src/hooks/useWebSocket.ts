import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getWebSocketUrl, getWebSocketConfig, logConnectionInfo } from "@/lib/websocketConfig";
import deviceControlService, { DeviceControlRequest } from "@/services/deviceControlService";
import { AppConstants } from '../config/AppConfig';

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

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
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
	// Voice commands
	latestVoiceCommand: VoiceCommand | null;
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
	const [latestVoiceCommand, setLatestVoiceCommand] = useState<VoiceCommand | null>(null);

	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

	// Use requestAnimationFrame to prevent UI blocking
	const updateSensorData = useCallback((data: any) => {
		requestAnimationFrame(() => {
			// Normalize sensor data format to handle service.backup format:
			// Service.backup format: { topic, sensor, data: { value, timestamp, quality, merged }, timestamp }
			// Standard format: { sensor, data, timestamp, value }

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
				// Fallback format handling
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

		// Connection events
		newSocket.on('connect', () => {
			console.log('✅ WebSocket connected successfully');
			setIsConnected(true);

			// Subscribe to sensor data
			newSocket.emit('sensors:subscribe');

			// Clear any existing reconnect timeout
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		});

		newSocket.on('disconnect', (reason) => {
			console.log(`🔌 WebSocket disconnected: ${reason}`);
			setIsConnected(false);

			// Attempt to reconnect after a delay if not manually disconnected
			if (reason !== 'io client disconnect') {
				reconnectTimeoutRef.current = setTimeout(() => {
					console.log('🔄 Attempting WebSocket reconnection...');
					newSocket.connect();
				}, AppConstants.UI.DEBOUNCE_DELAY * 10);
			}
		});

		newSocket.on('connect_error', (error) => {
			// Reduce console spam, only warn if connection hasn't been established recently
			if (!newSocket.connected) {
				console.warn('⚠️ WebSocket connection error (retrying...):', error.message);
				// Show user-friendly error notification for connection issues
				if (typeof window !== 'undefined') {
					const errorEvent = new CustomEvent('websocket:error', {
						detail: { message: 'Connection to server lost. Retrying...', type: 'warning' }
					});
					window.dispatchEvent(errorEvent);
				}
			}
			setIsConnected(false);
		});

		newSocket.on('reconnect_error', (error) => {
			console.warn('⚠️ WebSocket reconnection failed:', error.message);
		});

		newSocket.on('reconnect_failed', () => {
			// Longer delay before trying again
			setTimeout(() => {
				newSocket.connect();
			}, AppConstants.REFRESH.DEVICE_STATUS);
		});

		// Data events - Use callbacks to prevent UI blocking
		// Handle standardized sensor:data format (data.sensors[])
		newSocket.on('sensor:data', (standardizedData: any) => {
			if (standardizedData.success && standardizedData.data && standardizedData.data.sensors) {
				const sensorData = standardizedData.data.sensors[0];

				// Convert standardized format to internal format
				for (const [sensorType, value] of Object.entries(sensorData)) {
					if (sensorType !== 'timestamp' && sensorType !== 'createdAt' && sensorType !== 'dataQuality' &&
						sensorType !== '_id' && sensorType !== '__v' && sensorType !== 'deviceId' &&
						value !== null && value !== undefined) {

						// Map database field names to frontend expected names
						let frontendSensorType = sensorType;
						if (sensorType === 'soilMoisture') frontendSensorType = 'soil';
						if (sensorType === 'waterLevel') frontendSensorType = 'water';
						if (sensorType === 'lightLevel') frontendSensorType = 'light';
						if (sensorType === 'rainStatus') frontendSensorType = 'rain';
						if (sensorType === 'plantHeight') frontendSensorType = 'height';

						const internalData = {
							sensor: frontendSensorType,
							data: { value: value as number, quality: sensorData.dataQuality || 'good' },
							timestamp: sensorData.timestamp || sensorData.createdAt || new Date().toISOString(),
							value: value as number
						};
						updateSensorData(internalData);
					}
				}
			}
		});

		// Individual sensor channels (standardized format)
		newSocket.on('sensor:temperature', updateSensorData);
		newSocket.on('sensor:humidity', updateSensorData);
		newSocket.on('sensor:soil', updateSensorData);
		newSocket.on('sensor:water', updateSensorData);
		newSocket.on('sensor:light', updateSensorData);
		newSocket.on('sensor:height', updateSensorData);
		newSocket.on('sensor:rain', updateSensorData);

		// Standardized device events
		newSocket.on('device:status', updateDeviceStatus);

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

		// Standardized alerts
		newSocket.on('alert:new', updateAlerts);
		newSocket.on('alert', updateAlerts);

		// High priority alerts (critical/high level)
		newSocket.on('alert:priority', (alertData: any) => {
			updateAlerts(alertData);
			// High priority alerts could trigger additional UI notifications
			console.log('🚨 High priority alert received:', alertData);
		});

		// Device control confirmations
		newSocket.on('device:control', (_controlData: any) => {
			// Device control confirmation received
		});

		// Voice commands
		newSocket.on(AppConstants.WS_EVENTS.VOICE_COMMAND, (voiceData: VoiceCommand) => {
			console.log('🎤 Voice command received:', voiceData);
			setLatestVoiceCommand(voiceData);
		});

		newSocket.on(AppConstants.WS_EVENTS.VOICE_COMMAND_HISTORY, (voiceData: VoiceCommand) => {
			console.log('🎤 Voice command history update received:', voiceData);
			setLatestVoiceCommand(voiceData);
			// Dispatch custom event to trigger refresh of voice history
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('voiceHistoryUpdate', { detail: voiceData }));
			}
		});

		// Automation status
		newSocket.on('automation:update', (automationData: any) => {
			console.log('🤖 Automation status update received:', automationData);
			// This will be handled by AutomationContext if integrated
		});

		newSocket.on('automation:status', (automationData: any) => {
			console.log('🤖 Automation status received:', automationData);
			// This will be handled by AutomationContext if integrated
		});

		// System status
		newSocket.on('system-status', (_systemData: any) => {
			// System status update received
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

		newSocket.on('automation:update', (data: any) => {
			setAutomationSettings(data.settings || data);
		});

		newSocket.on('automation:settings-update', (data: any) => {
			setAutomationSettings(data.settings || data);
		});

		newSocket.on('automation:history', (data: any) => {
			console.log('🤖 Automation history update received:', data);
			// Trigger history refresh or add to local state
			window.dispatchEvent(new CustomEvent('automationHistoryUpdate', { detail: data }));
		});

		newSocket.on('manual:history', (data: any) => {
			console.log('👤 Manual control history update received:', data);
			// Trigger history refresh or add to local state
			window.dispatchEvent(new CustomEvent('manualHistoryUpdate', { detail: data }));
		});

		newSocket.on('history:device-control', (data: any) => {
			console.log('📝 Device control history update received:', data);
			// Trigger history refresh or add to local state
			window.dispatchEvent(new CustomEvent('deviceHistoryUpdate', { detail: data }));
		});

		newSocket.on('settings:threshold-update', (data: any) => {
			setThresholdSettings(data.thresholds);
			console.log('⚙️ Threshold settings updated via WebSocket:', data.thresholds);
		});

		newSocket.on('settings:email-update', (data: any) => {
			setEmailSettings(data.settings);
			console.log('📧 Email settings updated via WebSocket:', data.settings);
		});

		newSocket.on('user:settings-update', (data: any) => {
			setUserSettings(data.settings);
			console.log('👤 User settings updated via WebSocket:', data.settings);
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
		const request: DeviceControlRequest = {
			deviceType: deviceType as any,
			action: action as any
		};

		return await deviceControlService.sendDeviceControl(request);
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
		userSettings,
		latestVoiceCommand
	};
}
