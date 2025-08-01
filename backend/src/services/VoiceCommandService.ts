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
			const response = await this.executeCommand(command.toLowerCase().trim());

			// Update the database record
			voiceCommand.processed = true;
			voiceCommand.response = response;
			await voiceCommand.save();

			// Send via websocket
			webSocketService.broadcastVoiceCommand({
				id: (voiceCommand._id as any)?.toString() || 'unknown',
				command: voiceCommand.command,
				confidence: voiceCommand.confidence,
				timestamp: voiceCommand.timestamp.toISOString(),
				processed: true,
				response
			});

			console.log(`✅ Voice command processed successfully: "${command}" -> "${response}"`);

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

	private async executeCommand(command: string): Promise<string> {
		const cmd = command.toLowerCase().trim();

		// Exact mapping with embedded voice commands
		// Embedded mapping: 0="DongCua", 1="DongCuaSap", 2="MoCua", 3="MoCuaSap", 4="MoDen", 5="TatDen"

		if (cmd === 'mocuasap' || cmd.includes('mở cửa sập') || cmd.includes('open window')) {
			mqttService.publishDeviceControl('window', '1'); // 1 = open
			return 'Window opened (MoCuaSap command)';
		}

		if (cmd === 'dongcuasap' || cmd.includes('đóng cửa sập') || cmd.includes('close window')) {
			mqttService.publishDeviceControl('window', '0'); // 0 = close
			return 'Window closed (DongCuaSap command)';
		}

		if (cmd === 'moden' || cmd.includes('mở đèn') || cmd.includes('turn on light')) {
			mqttService.publishDeviceControl('light', '1'); // 1 = on
			return 'Light turned on (MoDen command)';
		}

		if (cmd === 'tatden' || cmd.includes('tắt đèn') || cmd.includes('turn off light')) {
			mqttService.publishDeviceControl('light', '0'); // 0 = off
			return 'Light turned off (TatDen command)';
		}

		if (cmd === 'mocua' || cmd.includes('mở cửa') || cmd.includes('open door')) {
			mqttService.publishDeviceControl('door', '1'); // 1 = open
			return 'Door opened (MoCua command)';
		}

		if (cmd === 'dongcua' || cmd.includes('đóng cửa') || cmd.includes('close door')) {
			mqttService.publishDeviceControl('door', '0'); // 0 = close
			return 'Door closed (DongCua command)';
		}

		// Legacy water pump commands (not in embedded but useful for manual control)
		if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('pump')) {
			mqttService.publishDeviceControl('pump', '1');
			return 'Water pump turned on';
		}

		if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('pump')) {
			mqttService.publishDeviceControl('pump', '0');
			return 'Water pump turned off';
		}

		// Auto mode commands
		if (cmd.includes('auto') && cmd.includes('mode')) {
			mqttService.publish('greenhouse/system/mode', 'auto');
			return 'Auto mode activated';
		}

		if (cmd.includes('manual') && cmd.includes('mode')) {
			mqttService.publish('greenhouse/system/mode', 'manual');
			return 'Manual mode activated';
		}

		// If no command matches, return a generic response
		console.log(`⚠️ Unrecognized voice command: "${command}"`);
		return `Command "${command}" received but not recognized`;
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
				response: cmd.response,
				errorMessage: cmd.errorMessage
			}));
		} catch (error) {
			console.error('Error fetching voice commands:', error);
			return [];
		}
	}
}

export const voiceCommandService = new VoiceCommandService();
