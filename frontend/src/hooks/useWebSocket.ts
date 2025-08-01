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
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

	// Use requestAnimationFrame to prevent UI blocking
	const updateSensorData = useCallback((data: SensorData) => {
		requestAnimationFrame(() => {
			setSensorData(data);

			// Update persistent sensor state
			const value = typeof data.data === 'object' ? data.data.value :
				data.data !== undefined ? parseFloat(data.data) :
					data.value !== undefined ? data.value : 0;

			if (!isNaN(value)) {
				setPersistentSensorData(prev => ({
					...prev,
					[data.sensor]: {
						value,
						timestamp: data.timestamp || new Date().toISOString()
					}
				}));

			} else {
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
		logConnectionInfo();


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

		newSocket.on('connect_error', () => {
			setIsConnected(false);

			// Don't spam error logs, just warn once per connection attempt
			if (!newSocket.recovered) {
			}
		});

		newSocket.on('reconnect_error', () => {
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
		newSocket.on('device:status', updateDeviceStatus);
		newSocket.on('device-status', updateDeviceStatus); // Legacy compatibility
		newSocket.on('alert:new', updateAlerts);
		newSocket.on('alert', updateAlerts); // Legacy compatibility

		newSocket.on('notification', () => {
			// Handle notifications here (could show toast, etc.)
		});

		setSocket(newSocket);

		// Cleanup function
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
			console.error('❌ Device control failed:', error);
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
		clearAlerts
	};
}
