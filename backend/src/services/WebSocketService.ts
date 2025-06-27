import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { mqttService } from './MQTTService';

class WebSocketService {
	private io: Server | null = null;
	private connectedClients = new Map<string, any>();

	initialize(httpServer: HttpServer) {
		this.io = new Server(httpServer, {
			cors: {
				origin: process.env.FRONTEND_URL || "http://localhost:3000",
				methods: ["GET", "POST"]
			}
		});

		this.setupEventHandlers();
		console.log('✅ WebSocket service initialized');
	}

	private setupEventHandlers() {
		if (!this.io) return;

		this.io.on('connection', (socket) => {
			console.log(`🔌 Client connected: ${socket.id}`);
			this.connectedClients.set(socket.id, socket);

			// Handle device control commands from frontend
			socket.on('device:control', (data) => {
				console.log('📡 Device control command received:', data);
				this.handleDeviceControl(data);
			});

			// Handle sensor data requests
			socket.on('sensors:subscribe', () => {
				console.log('📊 Client subscribed to sensor data');
				// Client will automatically receive sensor data via broadcastSensorData
			});

			socket.on('disconnect', () => {
				console.log(`🔌 Client disconnected: ${socket.id}`);
				this.connectedClients.delete(socket.id);
			});
		});

		// Listen to MQTT sensor data and broadcast to all WebSocket clients
		this.setupMQTTBridge();
	}

	private setupMQTTBridge() {
		// Bridge MQTT messages to WebSocket clients
		mqttService.onSensorData((topic: string, data: any) => {
			this.broadcastSensorData(topic, data);
		});

		mqttService.onDeviceStatus((topic: string, status: any) => {
			this.broadcastDeviceStatus(topic, status);
		});
	}

	private handleDeviceControl(data: any) {
		const { device, action, value } = data;

		// Map frontend device names to MQTT service types
		const deviceTypeMap: { [key: string]: 'light' | 'pump' | 'door' } = {
			'light': 'light',
			'pump': 'pump',
			'door': 'door',
			'window': 'door', // Map window to door for now
			'fan': 'pump' // Map fan to pump for now
		};

		const mqttDeviceType = deviceTypeMap[device];
		if (!mqttDeviceType) {
			console.error('Unknown device type:', device);
			return;
		}

		// Create command payload
		const command = JSON.stringify({
			action,
			value,
			timestamp: new Date().toISOString()
		});

		mqttService.publishDeviceControl(mqttDeviceType, command);
	}

	// Broadcast sensor data to all connected clients
	broadcastSensorData(topic: string, data: any) {
		if (!this.io) return;

		const sensorType = this.extractSensorType(topic);
		this.io.emit('sensor:data', {
			sensor: sensorType,
			data,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast device status to all connected clients
	broadcastDeviceStatus(topic: string, status: any) {
		if (!this.io) return;

		const deviceType = this.extractDeviceType(topic);
		this.io.emit('device:status', {
			device: deviceType,
			status,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast alerts to all connected clients
	broadcastAlert(alert: any) {
		if (!this.io) return;

		this.io.emit('alert:new', alert);
	}

	// Send notification to specific client or all clients
	sendNotification(notification: any, clientId?: string) {
		if (!this.io) return;

		if (clientId && this.connectedClients.has(clientId)) {
			this.connectedClients.get(clientId).emit('notification', notification);
		} else {
			this.io.emit('notification', notification);
		}
	}

	private extractSensorType(topic: string): string {
		// Extract sensor type from topic like "greenhouse/sensors/temperature"
		const parts = topic.split('/');
		return parts[parts.length - 1];
	}

	private extractDeviceType(topic: string): string {
		// Extract device type from topic like "greenhouse/devices/pump/control"
		const parts = topic.split('/');
		return parts[parts.length - 2];
	}

	// Get connection statistics
	getStats() {
		return {
			connectedClients: this.connectedClients.size,
			clients: Array.from(this.connectedClients.keys())
		};
	}
}

export const webSocketService = new WebSocketService();
export default webSocketService;
