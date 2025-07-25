import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';
import { AlertService } from './AlertService';
import { webSocketService } from './WebSocketService';

class MQTTService {
	private client: MqttClient | null = null;
	private isConnected: boolean = false;
	private alertService: AlertService;
	private webSocketService: typeof webSocketService;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 5;
	private onConnectedCallback: (() => void) | null = null;

	constructor(alertService: AlertService, wsService: typeof webSocketService) {
		this.alertService = alertService;
		this.webSocketService = wsService;
	}

	public setOnConnectedCallback(callback: () => void): void {
		this.onConnectedCallback = callback;
	}
	public connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mqtt.noboroto.id.vn:1883';
			const username = process.env.MQTT_USERNAME || 'vision';
			const password = process.env.MQTT_PASSWORD || 'vision';

			console.log('[MQTT] Attempting to connect to broker:', brokerUrl);

			this.client = mqtt.connect(brokerUrl, {
				username,
				password,
				clientId: `greenhouse-server-${Math.random().toString(16).substr(2, 8)}`,
				clean: true,
				reconnectPeriod: 5000,
				connectTimeout: 30000,
			});

			this.client.on('connect', () => {
				console.log('[MQTT] Successfully connected to broker');
				this.isConnected = true;
				this.reconnectAttempts = 0;
				this.subscribeToTopics();
				resolve(); // Resolve promise when connected
			});

			this.client.on('error', (error) => {
				console.error('[MQTT] Connection error:', error);
				this.isConnected = false;
				reject(error);
			});

			this.client.on('close', () => {
				console.log('[MQTT] Connection closed');
				this.isConnected = false;
			});

			this.client.on('reconnect', () => {
				this.reconnectAttempts++;
				console.log(`[MQTT] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

				if (this.reconnectAttempts >= this.maxReconnectAttempts) {
					console.error('[MQTT] Max reconnection attempts reached. Stopping reconnection.');
					this.client?.end();
				}
			});
		});
	}

	private subscribeToTopics(): void {
		if (!this.client || !this.isConnected) {
			console.error('[MQTT] Cannot subscribe: client not connected');
			return;
		}

		const topics = [
			'greenhouse/sensors/temperature',
			'greenhouse/sensors/humidity',
			'greenhouse/sensors/soil',
			'greenhouse/sensors/water',
			'greenhouse/sensors/light',
			'greenhouse/sensors/rain',
			'greenhouse/sensors/height',
			'greenhouse/sensors/motion',
			'greenhouse/devices/+/control',
			'greenhouse/devices/+/status',
			'greenhouse/system/mode',
			'greenhouse/command'
		];

		topics.forEach(topic => {
			this.client!.subscribe(topic, (err) => {
				if (err) {
					console.error(`[MQTT] Failed to subscribe to ${topic}:`, err);
				} else {
					console.log(`[MQTT] Successfully subscribed to ${topic}`);
				}
			});
		});
	}

	public setAlertService(alertService: AlertService): void {
		this.alertService = alertService;
	}

	public onMessage(callback: (topic: string, message: Buffer) => void): void {
		if (!this.client) {
			console.error('[MQTT] Cannot set message handler: client not initialized');
			return;
		}

		// Remove existing message listeners to avoid duplicates
		this.client.removeAllListeners('message');
		this.client.on('message', callback);
	}

	public publish(topic: string, message: string): void {
		if (!this.client || !this.isConnected) {
			console.error('[MQTT] Cannot publish: client not connected');
			return;
		}

		console.log(`[MQTT-PUBLISH] Publishing to topic '${topic}': ${message}`);
		this.client.publish(topic, message, (err) => {
			if (err) {
				console.error(`[MQTT-PUBLISH-ERROR] Failed to publish to ${topic}:`, err);
			} else {
				console.log(`[MQTT-PUBLISH-SUCCESS] Successfully published to ${topic}`);
			}
		});
	}

	public publishDeviceControl(device: string, action: string): void {
		if (!this.client || !this.isConnected) {
			console.error('[MQTT] Cannot publish: client not connected');
			return;
		}

		const topic = `greenhouse/devices/${device}/control`;
		this.client.publish(topic, action, { qos: 1 }, (err) => {
			if (err) {
				console.error(`[MQTT] Failed to publish to ${topic}:`, err);
			} else {
				console.log(`[MQTT] Published ${action} to ${topic}`);
			}
		});
	}

	public publishDebugFeedback(originalTopic: string, originalMessage: string, status: string = 'processed'): void {
		if (!this.client || !this.isConnected) {
			console.error('[MQTT] Cannot publish debug feedback: client not connected');
			return;
		}

		const debugTopic = 'greenhouse/debug/feedback';
		const feedbackMessage = JSON.stringify({
			originalTopic,
			originalMessage,
			status,
			timestamp: new Date().toISOString(),
			serverId: process.env.NODE_ENV || 'development'
		});

		this.client.publish(debugTopic, feedbackMessage, { qos: 0 }, (err) => {
			if (err) {
				console.error(`[MQTT] Failed to publish debug feedback:`, err);
			} else {
				console.log(`[MQTT] 🔍 Debug feedback sent: ${debugTopic} -> ${feedbackMessage}`);
			}
		});
	}

	public isClientConnected(): boolean {
		return this.isConnected && this.client?.connected === true;
	}

	public disconnect(): void {
		if (this.client) {
			console.log('[MQTT] Disconnecting from broker');
			this.client.end();
			this.isConnected = false;
		}
	}

	public getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
		return {
			connected: this.isConnected,
			reconnectAttempts: this.reconnectAttempts
		};
	}
}

// Export both the class and a singleton instance
export const mqttService = new MQTTService(null as any, null as any);
export { MQTTService };
