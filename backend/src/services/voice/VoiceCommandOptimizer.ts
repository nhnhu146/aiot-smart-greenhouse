import { webSocketService } from '../WebSocketService';
import { mqttService } from '../MQTTService';
import DeviceStatus from '../../models/DeviceStatus';
import VoiceCommand from '../../models/VoiceCommand';

export class VoiceCommandOptimizer {

	static async processCommandOptimized(command: string, confidence: number | null): Promise<void> {
		const startTime = process.hrtime.bigint();

		try {
			// Step 1: Parse and validate command (< 1ms)
			const deviceAction = this.parseCommand(command);
			if (!deviceAction) {
				console.warn(`Unrecognized voice command: ${command}`);
				return;
			}

			// Step 2: Send MQTT command IMMEDIATELY (< 5ms)
			mqttService.publishDeviceControl(deviceAction.device, deviceAction.action);

			// Step 3: Update UI immediately via WebSocket (< 10ms)  
			webSocketService.broadcastDeviceStatus(deviceAction.device, {
				device: deviceAction.device,
				status: deviceAction.action === 'on' || deviceAction.action === 'open' ? 'on' : 'off',
				timestamp: new Date().toISOString()
			});

			// Step 4: Background database operations (non-blocking)
			setImmediate(() => {
				this.updateDatabaseAsync(command, confidence, deviceAction);
			});

			const endTime = process.hrtime.bigint();
			const executionTime = Number(endTime - startTime) / 1000000; // Convert to ms

			console.log(`🚀 Voice command executed in ${executionTime.toFixed(2)}ms: ${command}`);

		} catch (error) {
			console.error('Error in voice command optimization:', error);
		}
	}

	private static parseCommand(command: string): { device: string, action: string } | null {
		const cmd = command.toLowerCase().trim();

		// Optimized command mapping with exact matches first
		const commandMap = new Map([
			['open door', { device: 'door', action: 'open' }],
			['close door', { device: 'door', action: 'close' }],
			['open window', { device: 'window', action: 'open' }],
			['close window', { device: 'window', action: 'close' }],
			['turn on light', { device: 'light', action: 'on' }],
			['turn off light', { device: 'light', action: 'off' }],
			['turn on pump', { device: 'pump', action: 'on' }],
			['turn off pump', { device: 'pump', action: 'off' }]
		]);

		// Try exact match first (fastest)
		if (commandMap.has(cmd)) {
			return commandMap.get(cmd)!;
		}

		// Fallback to substring matching
		for (const [key, value] of commandMap) {
			if (cmd.includes(key)) {
				return value;
			}
		}

		return null;
	}

	private static async updateDatabaseAsync(
		command: string,
		confidence: number | null,
		deviceAction: { device: string, action: string }
	): Promise<void> {
		try {
			// Update device status
			await DeviceStatus.findOneAndUpdate(
				{ deviceType: deviceAction.device },
				{
					deviceId: `greenhouse_${deviceAction.device}`,
					deviceType: deviceAction.device,
					status: deviceAction.action === 'on' || deviceAction.action === 'open'
				},
				{ upsert: true, new: true }
			);

			// Save voice command
			const voiceCommand = new VoiceCommand({
				command: command.toLowerCase().trim(),
				confidence,
				timestamp: new Date(),
				processed: true
			});
			await voiceCommand.save();

			// Broadcast voice command history
			webSocketService.broadcastVoiceCommand({
				id: (voiceCommand as any)._id.toString(),
				command: voiceCommand.command,
				confidence: voiceCommand.confidence,
				timestamp: voiceCommand.timestamp.toISOString(),
				processed: true
			});

		} catch (error) {
			console.error('Error in async database update:', error);
		}
	}
}
