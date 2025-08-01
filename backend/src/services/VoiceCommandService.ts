import { VoiceCommand } from '../models';
import { webSocketService } from './WebSocketService';
import { mqttService } from './MQTTService';

export class VoiceCommandService {

	async processVoiceCommand(command: string, confidence: number | null): Promise<void> {
		try {
			console.log(`🎤 Processing voice command: "${command}" (confidence: ${confidence !== null ? confidence : 'N/A'})`);

			// Save to database
			const voiceCommand = new VoiceCommand({
				command: command.toLowerCase().trim(),
				confidence,
				timestamp: new Date(),
				processed: false
			});

			await voiceCommand.save();
			console.log(`💾 Voice command saved to database: ${voiceCommand._id}`);

			// Process the command
			await this.executeCommand(command.toLowerCase().trim());

			// Update the database record
			voiceCommand.processed = true;
			await voiceCommand.save();

			// Send via websocket
			webSocketService.broadcastVoiceCommand({
				id: (voiceCommand._id as any)?.toString() || 'unknown',
				command: voiceCommand.command,
				confidence: voiceCommand.confidence,
				timestamp: voiceCommand.timestamp.toISOString(),
				processed: true
			});

			console.log(`✅ Voice command processed successfully: "${command}"`);

		} catch (error) {
			console.error(`❌ Error processing voice command "${command}":`, error);

			// Try to update database with error
			try {
				const voiceCommand = new VoiceCommand({
					command: command.toLowerCase().trim(),
					confidence,
					timestamp: new Date(),
					processed: true,
					errorMessage: error instanceof Error ? error.message : 'Unknown error'
				});
				await voiceCommand.save();
			} catch (dbError) {
				console.error('Failed to save error to database:', dbError);
			}
		}
	}

	private async executeCommand(command: string): Promise<void> {
		const cmd = command.toLowerCase().trim();

		// Map voice commands to device actions
		if (cmd.includes('open') && cmd.includes('door')) {
			mqttService.publishDeviceControl('door', 'open');
		}
		else if (cmd.includes('close') && cmd.includes('door')) {
			mqttService.publishDeviceControl('door', 'close');
		}
		else if (cmd.includes('open') && cmd.includes('window')) {
			mqttService.publishDeviceControl('window', 'open');
		}
		else if (cmd.includes('close') && cmd.includes('window')) {
			mqttService.publishDeviceControl('window', 'close');
		}
		else if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('light')) {
			mqttService.publishDeviceControl('light', 'on');
		}
		else if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('light')) {
			mqttService.publishDeviceControl('light', 'off');
		}
		else if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('pump')) {
			mqttService.publishDeviceControl('pump', 'on');
		}
		else if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('pump')) {
			mqttService.publishDeviceControl('pump', 'off');
		}
		// Auto mode commands
		else if (cmd.includes('auto') && cmd.includes('mode')) {
			mqttService.publish('greenhouse/system/mode', 'auto');
		}
		else if (cmd.includes('manual') && cmd.includes('mode')) {
			mqttService.publish('greenhouse/system/mode', 'manual');
		}

		console.log(`🎤 Voice command executed: "${command}"`);
	}

	async getVoiceCommands(limit: number = 50): Promise<any[]> {
		try {
			const commands = await VoiceCommand.find()
				.sort({ timestamp: -1 })
				.limit(limit)
				.lean();

			return commands.map(cmd => ({
				id: cmd._id?.toString() || 'unknown',
				command: cmd.command,
				confidence: cmd.confidence,
				timestamp: cmd.timestamp,
				processed: cmd.processed,
				errorMessage: cmd.errorMessage
			}));
		} catch (error) {
			console.error('Error fetching voice commands:', error);
			return [];
		}
	}
}

export const voiceCommandService = new VoiceCommandService();
