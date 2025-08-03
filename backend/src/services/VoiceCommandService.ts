import { VoiceCommand } from '../models';
import { deviceStateService } from './DeviceStateService';
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
				// timestamps: true will auto-generate createdAt/updatedAt
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
				timestamp: voiceCommand.createdAt?.toISOString() || new Date().toISOString(),
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
					// timestamps: true will auto-generate createdAt/updatedAt
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
			}
		else if (cmd.includes('close') && cmd.includes('door')) {
			}
		else if (cmd.includes('open') && cmd.includes('window')) {
			}
		else if (cmd.includes('close') && cmd.includes('window')) {
			}
		else if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('light')) {
			}
		else if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('light')) {
			}
		else if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('pump')) {
			}
		else if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('pump')) {
			}
		// Auto mode commands
		else if (cmd.includes('auto') && cmd.includes('mode')) {
			}
		else if (cmd.includes('manual') && cmd.includes('mode')) {
			}

		console.log(`🎤 Voice command executed: "${command}"`);
	}

	async getVoiceCommands(limit: number = 50): Promise<any[]> {
		try {
			const commands = await VoiceCommand.find()
				.sort({ createdAt: -1 })
				.limit(limit)
				.lean();

			return commands.map(cmd => ({
				id: cmd._id?.toString() || 'unknown',
				command: cmd.command,
				confidence: cmd.confidence,
				timestamp: cmd.createdAt,
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
