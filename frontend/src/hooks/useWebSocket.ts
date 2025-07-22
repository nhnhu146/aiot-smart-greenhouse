"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
	sendDeviceControl: (device: string, action: string, value?: any) => void;
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

				console.log(`📊 Sensor ${data.sensor} updated: ${value} (persistent state maintained)`);
			} else {
				console.warn(`⚠️ Invalid sensor value received for ${data.sensor}:`, data);
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
		// Get server URL from environment or default to localhost
		const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

		console.log('🔌 Connecting to WebSocket server:', serverUrl);

		const newSocket = io(serverUrl, {
			transports: ['websocket', 'polling'],
			timeout: 5000,
			retries: 3,
		});

		// Connection events
		newSocket.on('connect', () => {
			console.log('✅ Connected to WebSocket server');
			setIsConnected(true);

			// Subscribe to sensor data
			newSocket.emit('sensors:subscribe');

			// Clear any existing reconnect timeout
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		});

		newSocket.on('disconnect', (reason) => {
			console.log('🔌 Disconnected from WebSocket server:', reason);
			setIsConnected(false);

			// Attempt to reconnect after a delay if not manually disconnected
			if (reason !== 'io client disconnect') {
				reconnectTimeoutRef.current = setTimeout(() => {
					console.log('🔄 Attempting to reconnect...');
					newSocket.connect();
				}, 3000);
			}
		});

		newSocket.on('connect_error', (error) => {
			console.error('❌ WebSocket connection error:', error);
			setIsConnected(false);
		});

		// Data events - Use callbacks to prevent UI blocking
		newSocket.on('sensor:data', updateSensorData);
		newSocket.on('sensor-data', updateSensorData); // Legacy compatibility
		newSocket.on('device:status', updateDeviceStatus);
		newSocket.on('device-status', updateDeviceStatus); // Legacy compatibility
		newSocket.on('alert:new', updateAlerts);
		newSocket.on('alert', updateAlerts); // Legacy compatibility

		newSocket.on('notification', (notification: any) => {
			console.log('🔔 Notification:', notification);
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

	// Function to send device control commands
	const sendDeviceControl = useCallback((device: string, action: string, value?: any) => {
		if (socket && isConnected) {
			const controlData = {
				device,
				action,
				value,
				timestamp: new Date().toISOString()
			};

			console.log('🎮 Sending device control:', controlData);
			socket.emit('device:control', controlData);
		} else {
			console.warn('⚠️ WebSocket not connected, cannot send device control');
		}
	}, [socket, isConnected]);

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
