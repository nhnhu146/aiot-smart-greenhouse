import { mqttService, alertService, webSocketService, DataMergerService, automationService } from '../services';
import { SensorData } from '../models';

export class MQTTHandler {
	static setup(): void {
		// Inject AlertService into MQTTService to avoid circular dependency
		mqttService.setAlertService(alertService);

		mqttService.onMessage(async (topic: string, message: Buffer) => {
			try {
				console.log(`📨 Received MQTT message on topic: ${topic}`);

				const messageString = message.toString().trim();
				console.log(`📄 Message content: ${messageString}`);

				// Handle sensor data - IoT devices send only simple numeric values
				if (topic.startsWith('greenhouse/sensors/')) {
					await this.handleSensorData(topic, messageString);
				}
				// Handle voice commands from greenhouse/command topic
				else if (topic === 'greenhouse/command') {
					await this.handleVoiceCommand(messageString);
				}

			} catch (error) {
				console.error('❌ Error processing MQTT message:', error);
				// Send debug feedback for processing errors
				mqttService.publishDebugFeedback(topic, message.toString(), 'error_processing');
			}
		});
	}

	private static async handleSensorData(topic: string, messageString: string): Promise<void> {
		const sensorValue = parseFloat(messageString);

		if (isNaN(sensorValue)) {
			console.error('❌ Invalid sensor value received:', messageString);
			// Send debug feedback for invalid data
			mqttService.publishDebugFeedback(topic, messageString, 'error_invalid_value');
			return;
		}

		// Extract sensor type from topic
		const sensorType = topic.split('/')[2];
		console.log(`🔧 Processing ${sensorType} sensor with value: ${sensorValue}`);

		// Save to database using correct model structure
		await this.saveSensorDataToDatabase(sensorType, sensorValue);

		// Broadcast sensor data to WebSocket clients with merged data
		await webSocketService.broadcastSensorData(topic, {
			type: sensorType,
			value: sensorValue,
			timestamp: new Date().toISOString(),
			quality: 'good'
		});

		console.log(`📡 Broadcasted ${sensorType} sensor data: ${sensorValue}`);

		// Check alerts
		if (alertService) {
			await this.checkSensorAlerts(sensorType, sensorValue);
		}

		// Send debug feedback for successful processing
		mqttService.publishDebugFeedback(topic, messageString, 'success');
	}

	private static async handleVoiceCommand(messageString: string): Promise<void> {
		console.log(`🎤 Received voice command: ${messageString}`);

		// Import optimized voice command processor
		const { VoiceCommandOptimizer } = await import('../services/voice/VoiceCommandOptimizer');

		// Parse command and confidence score
		let command = messageString;
		let confidence: number | null = null;

		// Check if message contains confidence score (format: commandName;score)
		if (messageString.includes(';')) {
			const parts = messageString.split(';');
			command = parts[0];
			const scoreStr = parts[1];

			// Try to parse confidence score
			const parsedScore = parseFloat(scoreStr.replace(',', '.'));
			if (!isNaN(parsedScore)) {
				confidence = parsedScore;
				console.log(`🎯 Parsed confidence score: ${confidence}`);
			} else {
				console.log(`⚠️ Invalid confidence score format: ${scoreStr}, keeping as N/A`);
			}
		} else {
			console.log(`ℹ️ No confidence score provided, will display as N/A`);
		}

		// Process voice command with optimized handler for immediate response
		await VoiceCommandOptimizer.processCommandOptimized(command, confidence);

		// Send debug feedback
		mqttService.publishDebugFeedback('greenhouse/command', messageString, 'voice_command_processed');
	}

	private static async saveSensorDataToDatabase(sensorType: string, value: number): Promise<void> {
		try {
			const now = new Date();

			// Prepare new sensor data
			const newData: any = {
				deviceId: 'esp32-greenhouse-01',
				dataQuality: 'partial',
				createdAt: now
			};

			// Map sensor type to database field
			switch (sensorType) {
				case 'temperature':
					newData.temperature = value;
					break;
				case 'humidity':
					newData.humidity = value;
					break;
				case 'soil':
					newData.soilMoisture = value;
					break;
				case 'water':
					newData.waterLevel = value;
					break;
				case 'light':
					newData.lightLevel = value;
					break;
				case 'height':
					newData.plantHeight = value;
					break;
				case 'rain':
					newData.rainStatus = value;
					break;
				default:
					console.warn(`🔍 Unknown sensor type: ${sensorType}`);
					return;
			}

			// Set processing flag to prevent automation conflicts
			automationService.setDataProcessing(true);

			let finalDoc: any = null;

			try {
				// Save new document directly (merger service handles duplicates separately)
				const sensorDoc = new SensorData(newData);
				finalDoc = await sensorDoc.save();
				console.log(`💾 Saved ${sensorType} sensor data: ${value}`);
			} finally {
				// Always clear processing flag FIRST
				automationService.setDataProcessing(false);
			}

			// Process automation AFTER data processing is complete
			if (finalDoc) {
				try {
					await automationService.processSensorData(sensorType, value);
					console.log(`🤖 Automation processed for ${sensorType}: ${value}`);
				} catch (automationError) {
					console.error(`❌ Automation processing error for ${sensorType}:`, automationError);
				}
			}

		} catch (error) {
			console.error(`❌ Error saving sensor data to database:`, error);
		}
	}

	private static async checkSensorAlerts(sensorType: string, value: number): Promise<void> {
		try {
			// Create alert data structure expected by AlertService
			const alertData: any = {
				temperature: null,
				humidity: null,
				soilMoisture: null,
				waterLevel: null
			};

			// Set the specific sensor value
			switch (sensorType) {
				case 'temperature':
					alertData.temperature = value;
					break;
				case 'humidity':
					alertData.humidity = value;
					break;
				case 'soil':
					alertData.soilMoisture = value;
					break;
				case 'water':
					alertData.waterLevel = value;
					break;
			}

			// Only check alerts for supported sensor types
			if (['temperature', 'humidity', 'soil', 'water'].includes(sensorType)) {
				await alertService.checkSensorThresholds(alertData);
			}

		} catch (error) {
			console.error(`❌ Error checking sensor alerts:`, error);
		}
	}
}
