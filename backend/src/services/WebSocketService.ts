import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { DataMergerService } from './DataMergerService';
import { SensorData } from '../models';

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

	// Broadcast sensor data to all connected clients (signal only - optimized for API fetch)
	async broadcastSensorData(topic: string, data: SensorData) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		try {
			// Get latest merged data from database for accuracy check
			const latestData = await SensorData.findOne().sort({ createdAt: -1 }).lean();

			if (!latestData) {
				console.warn('⚠️ No sensor data found in database');
			}

			// Create notification object with minimal data for signaling
			const sensorSignal = {
				type: 'sensor_data_updated',
				sensor: data.type,
				timestamp: new Date().toISOString(),
				hasNewData: true,
				// Don't include actual values - frontend will fetch via API
				dataAvailable: latestData ? {
					temperature: latestData.temperature !== null,
					humidity: latestData.humidity !== null,
					soilMoisture: latestData.soilMoisture !== null,
					waterLevel: latestData.waterLevel !== null,
					lightLevel: latestData.lightLevel !== null,
					plantHeight: latestData.plantHeight !== null,
					rainStatus: latestData.rainStatus !== null,
					motionDetected: latestData.motionDetected !== null
				} : {}
			};

			console.log(`📡 Broadcasting sensor update signal: ${data.type} - Frontend should fetch latest data via API`);

			// Emit signal to all clients to refresh data from API
			this.io.emit('sensor:update-signal', sensorSignal);

			// Also emit specific sensor signal for targeted listening
			this.io.emit(`sensor:${data.type}:updated`, {
				type: data.type,
				timestamp: sensorSignal.timestamp,
				fetchRequired: true
			});

			// Legacy compatibility - signal only
			this.io.emit('sensor-data-signal', sensorSignal);

		} catch (error) {
			console.error('❌ Error broadcasting sensor update signal:', error);

			// Fallback minimal signal
			this.io.emit('sensor:update-signal', {
				type: 'sensor_data_updated',
				sensor: data.type,
				timestamp: new Date().toISOString(),
				hasNewData: true,
				error: true
			});
		}
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

	// Broadcast voice command updates to all connected clients
	broadcastVoiceCommand(voiceCommandData: {
		id: string;
		command: string;
		confidence: number | null;
		timestamp: string;
		processed: boolean;
		response?: string;
		errorMessage?: string;
	}) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`🎤 Broadcasting voice command: "${voiceCommandData.command}" (${voiceCommandData.confidence !== null ? voiceCommandData.confidence : 'N/A'})`);

		// Emit to all clients
		this.io.emit('voice-command', voiceCommandData);

		// Also emit to voice commands history channel
		this.io.emit('voice-command-history', voiceCommandData);
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
