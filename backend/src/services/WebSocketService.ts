import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

interface SensorData {
	type: string;
	value: number;
	timestamp: string;
	quality?: 'good' | 'fair' | 'poor';
}

interface DeviceStatus {
	device: string;
	status: string;
	timestamp: string;
}

interface AlertData {
	id: string;
	type: string;
	level: string;
	message: string;
	timestamp: string;
}

class WebSocketService {
	private io: Server | null = null;
	private connectedClients: Map<string, Socket> = new Map();

	initialize(httpServer: HttpServer) {
		this.io = new Server(httpServer, {
			cors: {
				origin: process.env.FRONTEND_URL || "http://localhost:3000",
				methods: ["GET", "POST"],
				credentials: true
			},
			pingTimeout: 60000,
			pingInterval: 25000,
			transports: ['websocket', 'polling']
		});

		this.io.on('connection', (socket: Socket) => {
			console.log(`📡 WebSocket client connected: ${socket.id}`);
			this.connectedClients.set(socket.id, socket);

			// Send welcome message with current status
			socket.emit('connection-status', {
				status: 'connected',
				clientId: socket.id,
				timestamp: new Date().toISOString()
			});

			// Handle real-time chart data requests
			socket.on('request-chart-data', () => {
				console.log(`📊 Chart data requested by ${socket.id}`);
				this.sendLatestChartData(socket);
			});

			// Handle client disconnect
			socket.on('disconnect', (reason) => {
				console.log(`📡 WebSocket client disconnected: ${socket.id} - ${reason}`);
				this.connectedClients.delete(socket.id);
			});

			// Handle ping requests for connection health
			socket.on('ping', () => {
				socket.emit('pong', { timestamp: new Date().toISOString() });
			});
		});

		console.log('✅ WebSocket service initialized');
	}

	// Broadcast sensor data to all connected clients
	broadcastSensorData(topic: string, data: SensorData) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		const sensorUpdate = {
			topic,
			sensor: data.type,
			data: {
				value: data.value,
				timestamp: data.timestamp,
				quality: data.quality || 'good'
			},
			timestamp: data.timestamp
		};

		console.log(`📡 Broadcasting sensor data: ${data.type} = ${data.value}`);

		// Emit to general sensor data channel
		this.io.emit('sensor:data', sensorUpdate);

		// Also emit to specific sensor channel for targeted listening
		this.io.emit(`sensor:${data.type}`, sensorUpdate);

		// Legacy format for backward compatibility
		this.io.emit('sensor-data', sensorUpdate);
		this.io.emit(`sensor-${data.type}`, sensorUpdate);
	}

	// Broadcast device status to all connected clients
	broadcastDeviceStatus(topic: string, status: DeviceStatus) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		const deviceUpdate = {
			topic,
			device: status.device,
			status: status.status,
			timestamp: status.timestamp
		};

		console.log(`📡 Broadcasting device status: ${status.device} = ${status.status}`);
		this.io.emit('device-status', deviceUpdate);
		this.io.emit(`device-${status.device}`, deviceUpdate);
	}

	// Broadcast alerts to all connected clients
	broadcastAlert(alert: AlertData) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`🚨 Broadcasting alert: ${alert.type} - ${alert.level}`);
		this.io.emit('alert', alert);

		// Send high priority alerts to specific channel
		if (alert.level === 'critical' || alert.level === 'high') {
			this.io.emit('priority-alert', alert);
		}
	}

	// Broadcast device control confirmation to all connected clients
	broadcastDeviceControl(controlData: {
		controlId: string;
		deviceType: string;
		action: string;
		status: boolean;
		source: string;
		timestamp: string;
		success: boolean;
	}) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`🎮 Broadcasting device control: ${controlData.deviceType} -> ${controlData.action}`);

		// Emit to all clients
		this.io.emit('device-control-confirmation', controlData);

		// Also emit to specific device channel
		this.io.emit(`device-control-${controlData.deviceType}`, controlData);

		// Broadcast device status update
		this.broadcastDeviceStatus(`greenhouse/devices/${controlData.deviceType}/status`, {
			device: controlData.deviceType,
			status: controlData.action,
			timestamp: controlData.timestamp
		});
	}

	// Send notification to specific client or all clients
	sendNotification(notification: any, clientId?: string) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		if (clientId && this.connectedClients.has(clientId)) {
			const client = this.connectedClients.get(clientId);
			client?.emit('notification', notification);
			console.log(`📬 Notification sent to client ${clientId}`);
		} else {
			this.io.emit('notification', notification);
			console.log('📬 Notification broadcast to all clients');
		}
	}

	// Send system status updates
	broadcastSystemStatus(status: {
		mqtt: boolean;
		database: boolean;
		email: boolean;
		timestamp: string;
	}) {
		if (!this.io) return;

		this.io.emit('system-status', status);
		console.log('📊 System status broadcast:', status);
	}

	// Send configuration updates
	broadcastConfigUpdate(config: any) {
		if (!this.io) return;

		this.io.emit('config-update', {
			...config,
			timestamp: new Date().toISOString()
		});
		console.log('⚙️ Configuration update broadcast');
	}

	// Get connection statistics
	getStats() {
		return {
			connectedClients: this.connectedClients.size,
			clientIds: Array.from(this.connectedClients.keys()),
			isActive: this.io !== null
		};
	}

	// Send heartbeat to maintain connections
	sendHeartbeat() {
		if (!this.io) return;

		this.io.emit('heartbeat', {
			timestamp: new Date().toISOString(),
			connectedClients: this.connectedClients.size
		});
	}

	// Send latest chart data to specific client
	private sendLatestChartData(socket: Socket) {
		// This would fetch latest sensor data from database
		// For now, send a placeholder response
		socket.emit('chart-data-response', {
			timestamp: new Date().toISOString(),
			message: 'Chart data request received - implement database fetch here'
		});
	}

	// Graceful shutdown
	shutdown() {
		if (this.io) {
			console.log('🔄 Shutting down WebSocket service...');
			this.io.emit('server-shutdown', {
				message: 'Server is shutting down',
				timestamp: new Date().toISOString()
			});
			this.io.close();
			this.io = null;
			this.connectedClients.clear();
			console.log('✅ WebSocket service shutdown complete');
		}
	}
}

export const webSocketService = new WebSocketService();
export default webSocketService;
