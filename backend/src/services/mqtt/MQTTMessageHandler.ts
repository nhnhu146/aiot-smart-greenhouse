import { webSocketService } from '../WebSocketService';
import { alertService } from '../AlertService';
import { deviceStateService } from '../DeviceStateService';
import automationService from '../AutomationService';
import VoiceCommand from '../../models/VoiceCommand';
import SensorData from '../../models/SensorData';
export class MQTTMessageHandler {

	static async handleSensorData(topic: string, message: string): Promise<void> {
		try {
			const sensorType = this.extractSensorType(topic);
			const sensorValue = parseFloat(message);
			if (isNaN(sensorValue)) {
				console.warn(`Invalid sensor value: ${message}`);
				return;
			}

			// Save to database with optimized batch processing
			await this.saveSensorDataOptimized(sensorType, sensorValue);
			// Broadcast via WebSocket (non-blocking)
			setImmediate(() => {
				webSocketService.broadcastSensorData(topic, {
					type: sensorType,
					value: sensorValue,
					timestamp: new Date().toISOString(),
					quality: 'good'
				});
			});
			// Check alerts (non-blocking)
			setImmediate(() => {
				alertService.checkSensorThresholds({
					temperature: sensorType === 'temperature' ? sensorValue : 0,
					humidity: sensorType === 'humidity' ? sensorValue : 0,
					soilMoisture: sensorType === 'soil' ? sensorValue : 0,
					waterLevel: sensorType === 'water' ? sensorValue : 0
				});
			});
		} catch (error) {
			console.error('Error handling sensor data:', error);
		}
	}

	static async handleVoiceCommand(message: string): Promise<void> {
		try {
			let command = message;
			let confidence: number | null = null;
			if (message.includes(';')) {
				const parts = message.split(';');
				command = parts[0];
				const scoreStr = parts[1];
				const parsedScore = parseFloat(scoreStr.replace(',', '.'));
				if (!isNaN(parsedScore)) {
					confidence = parsedScore;
				}
			}

			// Process voice command with immediate device control
			await this.processVoiceCommandImmediate(command, confidence);
		} catch (error) {
			console.error('Error handling voice command:', error);
		}
	}

	private static async processVoiceCommandImmediate(command: string, confidence: number | null): Promise<void> {
		const cmd = command.toLowerCase().trim();
		// Execute device control IMMEDIATELY without saving to database first
		const deviceAction = this.mapCommandToDevice(cmd);
		if (deviceAction) {
			// Update device state using DeviceStateService (non-blocking)
			setImmediate(async () => {
				try {
					const status = (deviceAction.action === 'on' || deviceAction.action === 'open');
					await deviceStateService.updateDeviceState(deviceAction.device, status, deviceAction.action);
				} catch (error) {
					console.error('Error updating device status:', error);
				}
			});
			// Save voice command to database (non-blocking)
			setImmediate(async () => {
				try {
					const voiceCommand = new VoiceCommand({
						command: cmd,
						confidence,
						processed: true
					});
					await voiceCommand.save();
					// Broadcast via WebSocket
					webSocketService.broadcastVoiceCommand({
						id: (voiceCommand as any)._id.toString(),
						command: voiceCommand.command,
						confidence: voiceCommand.confidence,
						timestamp: voiceCommand.createdAt?.toISOString() || new Date().toISOString(),
						processed: true
					});
				} catch (error) {
					console.error('Error saving voice command:', error);
				}
			});
		}
	}

	private static mapCommandToDevice(command: string): { device: string, action: string } | null {
		if (command.includes('open') && command.includes('door')) {
			return { device: 'door', action: 'open' };
		} else if (command.includes('close') && command.includes('door')) {
			return { device: 'door', action: 'close' };
		} else if (command.includes('open') && command.includes('window')) {
			return { device: 'window', action: 'open' };
		} else if (command.includes('close') && command.includes('window')) {
			return { device: 'window', action: 'close' };
		} else if (command.includes('turn') && command.includes('on') && command.includes('light')) {
			return { device: 'light', action: 'on' };
		} else if (command.includes('turn') && command.includes('off') && command.includes('light')) {
			return { device: 'light', action: 'off' };
		} else if (command.includes('turn') && command.includes('on') && command.includes('pump')) {
			return { device: 'pump', action: 'on' };
		} else if (command.includes('turn') && command.includes('off') && command.includes('pump')) {
			return { device: 'pump', action: 'off' };
		}
		return null;
	}

	private static extractSensorType(topic: string): string {
		const parts = topic.split('/');
		return parts[parts.length - 1];
	}

	private static async saveSensorDataOptimized(sensorType: string, value: number): Promise<void> {
		// Implement batch processing for better performance
		// Save immediately for critical data, batch for others
		try {
			// Map sensor types to proper field names in SensorData model
			const sensorDataObject: any = {
				dataQuality: 'complete'
			};
			// Map MQTT sensor types to model fields
			switch (sensorType) {
				case 'temperature':
					sensorDataObject.temperature = value;
					break;
				case 'humidity':
					sensorDataObject.humidity = value;
					break;
				case 'soil':
				case 'soilMoisture':
					sensorDataObject.soilMoisture = value;
					break;
				case 'water':
				case 'waterLevel':
					sensorDataObject.waterLevel = value;
					break;
				case 'light':
				case 'lightLevel':
					sensorDataObject.lightLevel = value;
					break;
				case 'rain':
				case 'rainStatus':
					sensorDataObject.rainStatus = value;
					break;
				case 'height':
				case 'plantHeight':
					sensorDataObject.plantHeight = value;
					break;
				default:
					console.warn(`Unknown sensor type: ${sensorType}`);
					return;
			}

			const sensorData = new SensorData(sensorDataObject);
			await sensorData.save();
			console.log(`💾 Saved sensor data: ${sensorType} = ${value}`);
			// Trigger automation processing for the specific sensor type
			if (automationService) {
				// Use the correct field name for automation
				const automationSensorType = sensorType === 'soil' ? 'soilMoisture' :
					sensorType === 'water' ? 'waterLevel' :
						sensorType === 'light' ? 'lightLevel' :
							sensorType === 'rain' ? 'rainStatus' :
								sensorType === 'height' ? 'plantHeight' : sensorType;
				await automationService.processSensorData(automationSensorType, value);
			}

			// Trigger alert checking for threshold monitoring
			if (alertService) {
				// Get the latest sensor data for complete threshold checking
				const latestSensorData = await SensorData.findOne().sort({ createdAt: -1 }).lean();
				if (latestSensorData) {
					await alertService.checkSensorThresholds({
						temperature: latestSensorData.temperature || 0,
						humidity: latestSensorData.humidity || 0,
						soilMoisture: latestSensorData.soilMoisture || 0,
						waterLevel: latestSensorData.waterLevel || 0
					});
				}
			}

		} catch (error) {
			console.error('Error saving sensor data:', error);
		}
	}
}
