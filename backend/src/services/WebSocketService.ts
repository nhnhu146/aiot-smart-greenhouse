import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WebSocketBroadcaster } from './websocket/WebSocketBroadcaster';
import { WebSocketConnectionManager } from './websocket/WebSocketConnectionManager';
import { WebSocketDataHandler } from './websocket/WebSocketDataHandler';
import {
	SensorData,
	DeviceStatus,
	AlertData,
	DeviceControlData,
	VoiceCommandData,
	SystemStatus,
	AutomationStatus,
	ConnectionStats
} from './websocket/WebSocketTypes';

class WebSocketService {
	private io: Server | null = null;
	private broadcaster: WebSocketBroadcaster | null = null;
	private connectionManager: WebSocketConnectionManager | null = null;
	private dataHandler: WebSocketDataHandler | null = null;

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

		// Initialize components
		this.broadcaster = new WebSocketBroadcaster(this.io);
		this.connectionManager = new WebSocketConnectionManager();
		this.dataHandler = new WebSocketDataHandler();

		this.io.on('connection', (socket) => {
			this.connectionManager!.handleConnection(socket);
		});

		console.log('✅ WebSocket service initialized');
	}

	// Broadcast sensor data to all connected clients (only merged data)
	async broadcastSensorData(topic: string, data: SensorData) {
		if (!this.io || !this.broadcaster || !this.dataHandler) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		try {
			const mergedValue = await this.dataHandler.prepareSensorDataForBroadcast(data);
			this.broadcaster.broadcastSensorData(topic, data, mergedValue);
		} catch (error) {
			console.error('❌ Error broadcasting merged sensor data:', error);
			// Fallback to original data
			this.broadcaster.broadcastSensorData(topic, data);
		}
	}

	// Broadcast device status to all connected clients
	broadcastDeviceStatus(topic: string, status: DeviceStatus) {
		if (!this.broadcaster) {
			console.error('❌ WebSocket not initialized');
			return;
		}
		this.broadcaster.broadcastDeviceStatus(topic, status);
	}

	// Broadcast alerts to all connected clients
	broadcastAlert(alert: AlertData) {
		if (!this.broadcaster) {
			console.error('❌ WebSocket not initialized');
			return;
		}
		this.broadcaster.broadcastAlert(alert);
	}

	// Broadcast device control confirmation to all connected clients
	broadcastDeviceControl(controlData: DeviceControlData) {
		if (!this.broadcaster) {
			console.error('❌ WebSocket not initialized');
			return;
		}
		this.broadcaster.broadcastDeviceControl(controlData);
	}

	// Broadcast voice command updates to all connected clients
	broadcastVoiceCommand(voiceCommandData: VoiceCommandData) {
		if (!this.broadcaster) {
			console.error('❌ WebSocket not initialized');
			return;
		}
		this.broadcaster.broadcastVoiceCommand(voiceCommandData);
	}

	// Send notification to specific client or all clients
	sendNotification(notification: any, clientId?: string) {
		if (!this.broadcaster || !this.connectionManager) {
			console.error('❌ WebSocket not initialized');
			return;
		}
		this.broadcaster.sendNotification(notification, clientId, this.connectionManager.getConnectedClients());
	}

	// Send system status updates
	broadcastSystemStatus(status: SystemStatus) {
		if (!this.broadcaster) return;
		this.broadcaster.broadcastSystemStatus(status);
	}

	// Send configuration updates
	broadcastConfigUpdate(config: any) {
		if (!this.broadcaster) return;
		this.broadcaster.broadcastConfigUpdate(config);
	}

	// Broadcast automation status updates to all connected clients
	broadcastAutomationStatus(automationStatus: AutomationStatus) {
		if (!this.broadcaster) {
			console.error('❌ WebSocket not initialized');
			return;
		}
		this.broadcaster.broadcastAutomationStatus(automationStatus);
	}

	// Get connection statistics
	getStats(): ConnectionStats {
		if (!this.connectionManager) {
			return {
				connectedClients: 0,
				clientIds: [],
				isActive: false
			};
		}
		return this.connectionManager.getStats();
	}

	// Send heartbeat to maintain connections
	sendHeartbeat() {
		if (!this.broadcaster || !this.connectionManager) return;
		this.broadcaster.sendHeartbeat(this.connectionManager.getStats().connectedClients);
	}

	// Graceful shutdown
	shutdown() {
		if (this.io && this.broadcaster) {
			console.log('🔄 Shutting down WebSocket service...');
			this.broadcaster.notifyShutdown();
			this.io.close();
			this.io = null;
			this.broadcaster = null;
			this.connectionManager?.clearConnections();
			this.connectionManager = null;
			this.dataHandler = null;
			console.log('✅ WebSocket service shutdown complete');
		}
	}
}

export const webSocketService = new WebSocketService();
export default webSocketService;
