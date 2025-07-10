import mqtt, { MqttClient } from 'mqtt';
import { MQTTTopics } from '../types';
import { SensorData } from '../models';

export class MQTTService {
	private client: MqttClient;
	private readonly topics: MQTTTopics;
	private sensorDataBuffer: Map<string, number> = new Map();
	private alertService: any = null; // Will be injected to avoid circular dependency
	private sensorDataCallbacks: Array<(topic: string, data: any) => void> = [];
	private deviceStatusCallbacks: Array<(topic: string, status: any) => void> = [];

	constructor() {
		this.topics = {
			SENSORS: {
				TEMPERATURE: 'greenhouse/sensors/temperature',
				HUMIDITY: 'greenhouse/sensors/humidity',
				SOIL: 'greenhouse/sensors/soil',
				WATER: 'greenhouse/sensors/water',
				HEIGHT: 'greenhouse/sensors/height',
				RAIN: 'greenhouse/sensors/rain',
				LIGHT: 'greenhouse/sensors/light',
				MOTION: 'greenhouse/sensors/motion'
			},
			DEVICES: {
				LIGHT_CONTROL: 'greenhouse/devices/light/control',
				PUMP_CONTROL: 'greenhouse/devices/pump/control',
				DOOR_CONTROL: 'greenhouse/devices/door/control',
				WINDOW_CONTROL: 'greenhouse/devices/window/control'
			}
		};

		this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
			clientId: process.env.MQTT_CLIENT_ID || 'greenhouse_backend',
			username: process.env.MQTT_USERNAME,
			password: process.env.MQTT_PASSWORD,
			keepalive: 60,
			reconnectPeriod: 1000,
			connectTimeout: 30 * 1000,
			will: {
				topic: 'greenhouse/backend/status',
				payload: 'offline',
				qos: 1,
				retain: true
			}
		});

		this.setupEventHandlers();
	}

	private setupEventHandlers(): void {
		this.client.on('connect', () => {
			console.log('✅ MQTT Client connected successfully');

			// Subscribe to all sensor topics
			Object.values(this.topics.SENSORS).forEach(topic => {
				this.client.subscribe(topic, { qos: 1 }, (error) => {
					if (error) {
						console.error(`❌ Failed to subscribe to ${topic}:`, error);
					} else {
						console.log(`📡 Subscribed to ${topic}`);
					}
				});
			});

			// Publish online status
			this.client.publish('greenhouse/backend/status', 'online', { qos: 1, retain: true });
		});

		this.client.on('error', (error) => {
			console.error('❌ MQTT Client error:', error);
		});

		this.client.on('offline', () => {
			console.log('⚠️ MQTT Client offline');
		});

		this.client.on('reconnect', () => {
			console.log('🔄 MQTT Client reconnecting...');
		});

		this.client.on('close', () => {
			console.log('🔌 MQTT Client connection closed');
		});

		// Set up message handler
		this.client.on('message', (topic, message) => {
			this.handleMessage(topic, message);
		});
	}

	public onMessage(callback: (topic: string, message: Buffer) => void): void {
		this.client.on('message', callback);
	}

	// Add callback for sensor data
	public onSensorData(callback: (topic: string, data: any) => void): void {
		this.sensorDataCallbacks.push(callback);
	}

	// Add callback for device status
	public onDeviceStatus(callback: (topic: string, status: any) => void): void {
		this.deviceStatusCallbacks.push(callback);
	}

	// Enhanced message handler that triggers callbacks
	private handleMessage(topic: string, message: Buffer): void {
		const receivedTimestamp = new Date(); // Capture receive time immediately

		try {
			const data = JSON.parse(message.toString());

			// Check if it's sensor data
			if (topic.includes('/sensors/')) {
				this.sensorDataCallbacks.forEach(callback => callback(topic, data));
				this.processSensorData(topic, typeof data === 'number' ? data : data.value, receivedTimestamp);
			}

			// Check if it's device status
			if (topic.includes('/devices/') && topic.includes('/status')) {
				this.deviceStatusCallbacks.forEach(callback => callback(topic, data));
			}
		} catch (error) {
			// Handle non-JSON messages
			const value = parseFloat(message.toString());
			if (!isNaN(value) && topic.includes('/sensors/')) {
				this.sensorDataCallbacks.forEach(callback => callback(topic, { value }));
				this.processSensorData(topic, value, receivedTimestamp);
			}
		}
	}

	public publishDeviceControl(deviceType: 'light' | 'pump' | 'door' | 'window', command: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const topic = this.getDeviceControlTopic(deviceType);

			this.client.publish(topic, command, { qos: 1 }, (error) => {
				if (error) {
					console.error(`❌ Failed to publish to ${topic}:`, error);
					reject(error);
				} else {
					console.log(`📤 Published to ${topic}: ${command}`);
					resolve();
				}
			});
		});
	}

	private getDeviceControlTopic(deviceType: 'light' | 'pump' | 'door' | 'window'): string {
		switch (deviceType) {
			case 'light':
				return this.topics.DEVICES.LIGHT_CONTROL;
			case 'pump':
				return this.topics.DEVICES.PUMP_CONTROL;
			case 'door':
				return this.topics.DEVICES.DOOR_CONTROL;
			case 'window':
				return this.topics.DEVICES.WINDOW_CONTROL;
			default:
				throw new Error(`Unknown device type: ${deviceType}`);
		}
	}

	public disconnect(): void {
		this.client.end();
	}

	public isConnected(): boolean {
		return this.client.connected;
	}

	public getTopics(): MQTTTopics {
		return this.topics;
	}

	// Inject AlertService to avoid circular dependency
	public setAlertService(alertService: any): void {
		this.alertService = alertService;
	}

	// Process incoming sensor data and trigger threshold checks
	public async processSensorData(topic: string, value: number, receivedTimestamp?: Date): Promise<void> {
		try {
			// Store sensor value in buffer (timestamp is handled by MongoDB)
			const sensorType = this.getSensorTypeFromTopic(topic);
			if (sensorType) {
				this.sensorDataBuffer.set(sensorType, value);
				console.log(`📊 Sensor data received: ${sensorType} = ${value}`);

				// Save individual sensor data immediately to ensure no data loss
				await this.saveIndividualSensorData(sensorType, value);

				// Handle special cases
				if (sensorType === 'motionDetected' && value === 1 && this.alertService) {
					// Motion detected - trigger alert
					await this.alertService.handleMotionDetected();
				}

				// Check if we have all required sensor data for threshold checking
				const requiredSensors = ['temperature', 'humidity', 'soilMoisture', 'waterLevel'];
				const hasAllData = requiredSensors.every(sensor => this.sensorDataBuffer.has(sensor));

				if (hasAllData && this.alertService) {
					const sensorData = {
						temperature: this.sensorDataBuffer.get('temperature')!,
						humidity: this.sensorDataBuffer.get('humidity')!,
						soilMoisture: this.sensorDataBuffer.get('soilMoisture')!,
						waterLevel: this.sensorDataBuffer.get('waterLevel')!
					};

					// Trigger threshold checking
					await this.alertService.checkSensorThresholds(sensorData);

					// Save complete sensor data set (without timestamp - MongoDB handles it)
					await this.saveSensorData(sensorData);
				}
			}
		} catch (error) {
			console.error('Error processing sensor data:', error);

			// Send system error alert if available
			if (this.alertService) {
				await this.alertService.handleSystemError(
					error instanceof Error ? error.message : 'Unknown error',
					'MQTT Service'
				);
			}
		}
	}

	private getSensorTypeFromTopic(topic: string): string | null {
		if (topic.includes('temperature')) return 'temperature';
		if (topic.includes('humidity')) return 'humidity';
		if (topic.includes('soil')) return 'soilMoisture';
		if (topic.includes('water')) return 'waterLevel';
		if (topic.includes('height')) return 'plantHeight';
		if (topic.includes('rain')) return 'rainStatus';
		if (topic.includes('light')) return 'lightLevel';
		if (topic.includes('motion')) return 'motionDetected';
		return null;
	}

	private async saveSensorData(data: {
		temperature: number;
		humidity: number;
		soilMoisture: number;
		waterLevel: number;
	}): Promise<void> {
		try {
			const sensorData = new SensorData({
				...data,
				plantHeight: this.sensorDataBuffer.get('plantHeight') || null,
				rainStatus: this.sensorDataBuffer.get('rainStatus') || null,
				lightLevel: this.sensorDataBuffer.get('lightLevel') || null,
				motionDetected: this.sensorDataBuffer.get('motionDetected') || null,
				dataQuality: 'complete'
			});

			await sensorData.save();
			console.log(`💾 Complete sensor data saved with MongoDB timestamp`);
		} catch (error) {
			console.error('Error saving complete sensor data:', error);
		}
	}

	// Save individual sensor reading immediately to prevent data loss
	private async saveIndividualSensorData(sensorType: string, value: number): Promise<void> {
		try {
			// Create a sensor data record with only the current sensor value
			const sensorData: any = {
				temperature: null,
				humidity: null,
				soilMoisture: null,
				waterLevel: null,
				plantHeight: null,
				rainStatus: null,
				lightLevel: null,
				motionDetected: null,
				dataQuality: 'partial'
			};

			// Set the specific sensor value
			switch (sensorType) {
				case 'temperature':
					sensorData.temperature = value;
					break;
				case 'humidity':
					sensorData.humidity = value;
					break;
				case 'soilMoisture':
					sensorData.soilMoisture = value;
					break;
				case 'waterLevel':
					sensorData.waterLevel = value;
					break;
				case 'plantHeight':
					sensorData.plantHeight = value;
					break;
				case 'rainStatus':
					sensorData.rainStatus = Boolean(value);
					break;
				case 'lightLevel':
					sensorData.lightLevel = value;
					break;
				case 'motionDetected':
					sensorData.motionDetected = Boolean(value);
					break;
				default:
					console.warn(`Unknown sensor type: ${sensorType}`);
					return;
			}

			const newSensorData = new SensorData(sensorData);
			await newSensorData.save();
			console.log(`💾 Individual sensor data saved: ${sensorType} = ${value} with MongoDB timestamp`);
		} catch (error) {
			console.error(`Error saving individual sensor data for ${sensorType}:`, error);
		}
	}
}

export const mqttService = new MQTTService();
