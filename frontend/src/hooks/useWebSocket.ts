"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface SensorData {
	sensor: string;
	data: any;
	timestamp: string;
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
	deviceStatus: DeviceStatus | null;
	alerts: Alert[];
	sendDeviceControl: (device: string, action: string, value?: any) => void;
	clearAlerts: () => void;
}

export default function useWebSocket(): UseWebSocketReturn {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [sensorData, setSensorData] = useState<SensorData | null>(null);
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

	useEffect(() => {
		// Get server URL from environment or default to localhost
		const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

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

		// Data events
		newSocket.on('sensor:data', (data: SensorData) => {
			console.log('📊 Sensor data received:', data);
			setSensorData(data);
		});

		newSocket.on('device:status', (status: DeviceStatus) => {
			console.log('🔧 Device status received:', status);
			setDeviceStatus(status);
		});

		newSocket.on('alert:new', (alert: Alert) => {
			console.log('🚨 New alert:', alert);
			setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
		});

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
	}, []);

	// Function to send device control commands
	const sendDeviceControl = (device: string, action: string, value?: any) => {
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
	};

	// Function to clear alerts
	const clearAlerts = () => {
		setAlerts([]);
	};

	return {
		socket,
		isConnected,
		sensorData,
		deviceStatus,
		alerts,
		sendDeviceControl,
		clearAlerts
	};
}
