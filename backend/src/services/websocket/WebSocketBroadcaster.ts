import { Server, Socket } from 'socket.io';
import {
	SensorData,
	DeviceStatus,
	AlertData,
	DeviceControlData,
	VoiceCommandData,
	SystemStatus,
	AutomationStatus
} from './WebSocketTypes';
export class WebSocketBroadcaster {
	constructor(private io: Server) {}

	// Broadcast sensor data to all connected clients
	broadcastSensorData(topic: string, data: SensorData, mergedValue?: number) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		const sensorUpdate = {
			topic,
			sensor: data.type,
			data: {
				value: mergedValue ?? data.value,
				timestamp: data.timestamp,
				quality: data.quality || 'merged',
				merged: mergedValue !== undefined
			},
			timestamp: data.timestamp
		};
		console.log(`📡 Broadcasting sensor data: ${data.type} = ${mergedValue ?? data.value}`);
		// Emit to standardized sensor data channels only
		this.io.emit('sensor:data', sensorUpdate);
		this.io.emit(`sensor:${data.type}`, sensorUpdate);
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
	broadcastDeviceControl(controlData: DeviceControlData) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`🎮 Broadcasting device control: ${controlData.deviceType} -> ${controlData.action}`);
		// Emit to all clients
		this.io.emit('device-control-confirmation', controlData);
		this.io.emit(`device-control-${controlData.deviceType}`, controlData);
		// Broadcast device status update
		this.broadcastDeviceStatus(`greenhouse/devices/${controlData.deviceType}/status`, {
			device: controlData.deviceType,
			status: controlData.action,
			timestamp: controlData.timestamp
		});
	}

	// Broadcast voice command updates to all connected clients
	broadcastVoiceCommand(voiceCommandData: VoiceCommandData) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`🎤 Broadcasting voice command: '${voiceCommandData.command}' (${voiceCommandData.confidence !== null ? voiceCommandData.confidence : 'N/A'})`);
		this.io.emit('voice-command', voiceCommandData);
		this.io.emit('voice-command-history', voiceCommandData);
	}

	// Send system status updates
	broadcastSystemStatus(status: SystemStatus) {
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

	// Broadcast automation status updates to all connected clients
	broadcastAutomationStatus(automationStatus: AutomationStatus) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		console.log(`⚙️ Broadcasting automation status: ${automationStatus.enabled ? 'ENABLED' : 'DISABLED'}`);
		this.io.emit('automation-status', automationStatus);
		this.io.emit('automation-status-update', automationStatus);
	}

	// Send notification to specific client or all clients
	sendNotification(notification: any, clientId?: string, connectedClients?: Map<string, Socket>) {
		if (!this.io) {
			console.error('❌ WebSocket not initialized');
			return;
		}

		if (clientId && connectedClients?.has(clientId)) {
			const client = connectedClients.get(clientId);
			client?.emit('notification', notification);
			console.log(`📬 Notification sent to client ${clientId}`);
		} else {
			this.io.emit('notification', notification);
			console.log('📬 Notification broadcast to all clients');
		}
	}

	// Send heartbeat to maintain connections
	sendHeartbeat(connectedClients: number) {
		if (!this.io) return;
		this.io.emit('heartbeat', {
			timestamp: new Date().toISOString(),
			connectedClients
		});
	}

	// Server shutdown notification
	notifyShutdown() {
		if (!this.io) return;
		console.log('🔄 Notifying clients of server shutdown...');
		this.io.emit('server-shutdown', {
			message: 'Server is shutting down',
			timestamp: new Date().toISOString()
		});
	}
}
