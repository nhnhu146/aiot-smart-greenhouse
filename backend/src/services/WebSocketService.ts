import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { DataMergerService } from './DataMergerService';
import { SensorData } from '../models';

interface SensorDataInterface {
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
			pingTimeout: 60000,     // Increased timeout
			pingInterval: 25000,    // Standard interval
			connectTimeout: 10000,  // Connection timeout
			transports: ['websocket', 'polling'],
			allowEIO3: true,        // Better compatibility
			upgradeTimeout: 10000   // Upgrade timeout
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

			// Handle real-time chart data requests - send latest sensor data
			socket.on('request-chart-data', async () => {
				console.log(`📊 Chart data requested by ${socket.id}`);

				try {
					// Get latest sensor data from database
					const latestData = await SensorData.findOne()
						.sort({ createdAt: -1 })
						.lean();

					if (latestData) {
						// Send standardized response format
						socket.emit('chart-data-response', {
							success: true,
							data: {
								sensors: [latestData]
							},
							timestamp: new Date().toISOString()
						});
					} else {
						socket.emit('chart-data-response', {
							success: false,
							message: 'No sensor data available',
							data: { sensors: [] },
							timestamp: new Date().toISOString()
						});
					}
				} catch (error) {
					console.error('Error fetching chart data:', error);
					socket.emit('chart-data-response', {
						success: false,
						message: 'Error fetching sensor data',
						data: { sensors: [] },
						timestamp: new Date().toISOString()
					});
				}
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

	// Broadcast sensor data to all connected clients (standardized format)
	async broadcastSensorData(topic: string, data: SensorDataInterface) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		try {
			// Get the latest merged sensor data from database
			const latestData = await SensorData.findOne()
				.sort({ createdAt: -1 })
				.lean();

			if (!latestData) {
				console.warn('⚠️ No sensor data found in database');
				// Send the incoming data as fallback
				const fallbackResponse = {
					success: true,
					data: {
						sensors: [{
							[data.type]: data.value,
							timestamp: data.timestamp,
							createdAt: data.timestamp,
							dataQuality: data.quality || 'fallback'
						}]
					},
					eventType: 'sensor:data',
					timestamp: data.timestamp
				};

				this.io.emit('sensor:data', fallbackResponse);
				console.log(`📡 Broadcasting fallback sensor data: ${data.type} = ${data.value}`);
				return;
			}

			// Create standardized WebSocket response format matching REST API
			const standardizedResponse = {
				success: true,
				data: {
					sensors: [latestData]
				},
				eventType: 'sensor:data',
				timestamp: new Date().toISOString()
			};

			// Broadcast standardized sensor data
			this.io.emit('sensor:data', standardizedResponse);

			console.log(`📡 Broadcasting sensor data: ${data.type} = ${data.value} (from database)`);

		} catch (error) {
			console.error('❌ Error broadcasting sensor data:', error);

			// Fallback to original data if fetch fails
			const fallbackResponse = {
				success: true,
				data: {
					sensors: [{
						[data.type]: data.value,
						timestamp: data.timestamp,
						createdAt: data.timestamp,
						dataQuality: data.quality || 'fallback'
					}]
				},
				eventType: 'sensor:data',
				timestamp: data.timestamp
			};

			this.io.emit('sensor:data', fallbackResponse);
			console.log(`📡 Broadcasting fallback sensor data: ${data.type} = ${data.value}`);
		}
	}

	// Broadcast device status to all connected clients
	broadcastDeviceStatus(topic: string, status: DeviceStatus) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		const deviceUpdate = {
			event: 'device:status',
			data: {
				topic,
				device: status.device,
				status: status.status,
				timestamp: status.timestamp
			},
			timestamp: status.timestamp,
			source: 'device'
		};

		console.log(`📡 Broadcasting device status: ${status.device} = ${status.status}`);
		this.io.emit('device:status', deviceUpdate);
		this.io.emit(`device:${status.device}`, deviceUpdate);
	}

	// Broadcast device state sync to all connected clients
	broadcastDeviceStateSync(deviceStates: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		const syncEvent = {
			event: 'device:state:sync',
			data: {
				states: deviceStates,
				timestamp: new Date().toISOString()
			},
			timestamp: new Date().toISOString(),
			source: 'system'
		};

		console.log('📡 Broadcasting device state sync to all clients');
		this.io.emit('device:state:sync', syncEvent);
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
			this.io.emit('alert:priority', alert);
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

		const controlEvent = {
			event: 'device:control',
			data: controlData,
			timestamp: controlData.timestamp,
			source: controlData.source
		};

		console.log(`🎮 Broadcasting device control: ${controlData.deviceType} -> ${controlData.action}`);

		// Emit to all clients
		this.io.emit('device:control', controlEvent);

		// Also emit to specific device channel
		this.io.emit(`device:control:${controlData.deviceType}`, controlEvent);

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

		this.io.emit('system:config-update', {
			...config,
			timestamp: new Date().toISOString()
		});
		console.log('⚙️ Configuration update broadcast');
	}

	// Broadcast automation status updates to all connected clients
	broadcastAutomationStatus(automationStatus: {
		enabled: boolean;
		lastUpdate: string;
		activeControls: {
			light: boolean;
			pump: boolean;
			door: boolean;
			window: boolean;
		};
	}) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`⚙️ Broadcasting automation status: ${automationStatus.enabled ? 'ENABLED' : 'DISABLED'}`);

		// Emit standardized automation update event
		this.io.emit('automation:update', automationStatus);

		// Also emit to status channel for real-time sync
		this.io.emit('automation:status', {
			...automationStatus,
			timestamp: new Date().toISOString()
		});
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

	// Broadcast device state updates specifically for frontend synchronization
	broadcastDeviceStateUpdate(deviceType: string, state: {
		status: boolean;
		isOnline: boolean;
		lastCommand: string | null;
		updatedAt: Date;
	}) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`📡 Broadcasting device state update: ${deviceType} = ${state.status ? 'ON' : 'OFF'}`);

		const stateUpdateEvent = {
			event: 'device:state:update',
			data: {
				deviceType,
				status: state.status,
				isOnline: state.isOnline,
				lastCommand: state.lastCommand,
				updatedAt: state.updatedAt,
				timestamp: new Date().toISOString()
			},
			timestamp: new Date().toISOString(),
			source: 'system'
		};

		// Emit to device state channel
		this.io.emit('device:state:update', stateUpdateEvent);

		// Also emit to specific device channel for targeted updates
		this.io.emit(`device:${deviceType}:state`, stateUpdateEvent);
	}


	// Broadcast automation settings changes
	broadcastAutomationUpdate(settings: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log('📡 Broadcasting automation settings update');
		this.io.emit('automation:settings-update', {
			settings,
			timestamp: new Date().toISOString()
		});

		// Also emit to automation:update for frontend compatibility
		this.io.emit('automation:update', {
			settings,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast automation-triggered device history
	broadcastAutomationHistory(historyData: {
		deviceType: string;
		action: string;
		status: boolean;
		triggeredBy: string;
		sensorValue: number;
		timestamp: string;
	}) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`📡 Broadcasting automation history: ${historyData.deviceType} ${historyData.action} by ${historyData.triggeredBy}`);

		const historyEvent = {
			event: 'automation:history',
			data: historyData,
			timestamp: historyData.timestamp,
			source: 'automation'
		};

		this.io.emit('automation:history', historyEvent);
		this.io.emit('history:device-control', historyEvent);
		this.io.emit('database:change', {
			collection: 'DeviceHistory',
			operation: 'insert',
			data: historyData,
			timestamp: historyData.timestamp
		});
	}

	// Broadcast manual device history
	broadcastManualHistory(historyData: {
		deviceType: string;
		action: string;
		status: boolean;
		userId: string;
		timestamp: string;
	}) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`📡 Broadcasting manual history: ${historyData.deviceType} ${historyData.action} by user`);

		const historyEvent = {
			event: 'manual:history',
			data: historyData,
			timestamp: historyData.timestamp,
			source: 'manual'
		};

		this.io.emit('manual:history', historyEvent);
		this.io.emit('history:device-control', historyEvent);
		this.io.emit('database:change', {
			collection: 'DeviceHistory',
			operation: 'insert',
			data: historyData,
			timestamp: historyData.timestamp
		});
	}

	// Broadcast threshold settings changes
	broadcastThresholdUpdate(thresholds: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log('📡 Broadcasting threshold settings update');
		this.io.emit('settings:threshold-update', {
			thresholds,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast email settings changes
	broadcastEmailSettingsUpdate(settings: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log('📡 Broadcasting email settings update');
		this.io.emit('settings:email-update', {
			settings,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast system configuration changes
	broadcastSystemConfigUpdate(config: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log('📡 Broadcasting system config update');
		this.io.emit('system:config-update', {
			config,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast user settings changes
	broadcastUserSettingsUpdate(userId: string, settings: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`📡 Broadcasting user settings update for: ${userId}`);
		this.io.emit('user:settings-update', {
			userId,
			settings,
			timestamp: new Date().toISOString()
		});
	}

	// Broadcast database changes (for real-time sync)
	broadcastDatabaseChange(collection: string, operation: string, data: any) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`📡 Broadcasting database change: ${collection}.${operation}`);
		this.io.emit('database:change', {
			collection,
			operation,
			data,
			timestamp: new Date().toISOString()
		});
	}

	// Enhanced connection health monitoring
	broadcastConnectionHealth() {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		const stats = {
			connectedClients: this.connectedClients.size,
			clientIds: Array.from(this.connectedClients.keys()),
			timestamp: new Date().toISOString(),
			serverUptime: process.uptime()
		};

		this.io.emit('connection:health', stats);
		return stats;
	}
}

export const webSocketService = new WebSocketService();
export default webSocketService;
