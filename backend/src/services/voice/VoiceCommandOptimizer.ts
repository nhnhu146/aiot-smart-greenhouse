import { webSocketService } from '../WebSocketService';
import { deviceStateService } from '../DeviceStateService';
import DeviceStatus from '../../models/DeviceStatus';
import VoiceCommand from '../../models/VoiceCommand';

export class VoiceCommandOptimizer {

	static async processCommandOptimized(command: string, confidence: number | null): Promise<void> {
		const startTime = process.hrtime.bigint();

		try {
			// Step 1: Parse and validate command (< 1ms)
			const deviceAction = this.parseCommand(command);
			if (!deviceAction) {
				console.warn(`❓ Unrecognized voice command: ${command}`);
				return;
			}

			const { device, action } = deviceAction;
			const status = (action === 'on' || action === 'open');

			// Step 2: Update device state using DeviceStateService (< 10ms)
			await deviceStateService.updateDeviceState(device, status, action);

			// Step 3: Background database operations (non-blocking)
			setImmediate(async () => {
				try {
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
						timestamp: voiceCommand.createdAt?.toISOString() || new Date().toISOString(),
						processed: true
					});

				} catch (error) {
					console.error('Error saving voice command:', error);
				}
			});

			const endTime = process.hrtime.bigint();
			const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
			console.log(`🎤 Voice command processed in ${executionTime.toFixed(2)}ms: "${command}" -> ${device} ${action}`);

		} catch (error) {
			console.error(`❌ Error processing voice command: ${command}`, error);
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
}
