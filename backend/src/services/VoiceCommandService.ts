import { VoiceCommand } from '../models';
import { webSocketService } from './WebSocketService';
export class VoiceCommandService {

	async processVoiceCommand(command: string, confidence: number | null): Promise<void> {
		try {
			console.log(`🎤 Processing voice command: '${command}' (confidence: ${confidence !== null ? confidence : 'N/A'})`);
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
			console.log(`✅ Voice command processed successfully: '${command}'`);
		} catch (error) {
			console.error(`❌ Error processing voice command '${command}':`, error);
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
		
		try {
			// Map voice commands to device actions using proper device control
			if (cmd.includes('open') && cmd.includes('door')) {
				await this.controlDevice('door', true);
			}
			else if (cmd.includes('close') && cmd.includes('door')) {
				await this.controlDevice('door', false);
			}
			else if (cmd.includes('open') && cmd.includes('window')) {
				await this.controlDevice('window', true);
			}
			else if (cmd.includes('close') && cmd.includes('window')) {
				await this.controlDevice('window', false);
			}
			else if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('light')) {
				await this.controlDevice('light', true);
			}
			else if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('light')) {
				await this.controlDevice('light', false);
			}
			else if (cmd.includes('turn') && cmd.includes('on') && cmd.includes('pump')) {
				await this.controlDevice('pump', true);
			}
			else if (cmd.includes('turn') && cmd.includes('off') && cmd.includes('pump')) {
				await this.controlDevice('pump', false);
			}
			// Auto mode commands
			else if (cmd.includes('auto') && cmd.includes('mode')) {
				console.log('🤖 Enabling automation mode');
				// Could integrate with AutomationService here
			}
			else if (cmd.includes('manual') && cmd.includes('mode')) {
				console.log('👤 Enabling manual mode');
				// Could integrate with AutomationService here
			}
			else {
				console.log(`❓ Unknown voice command: '${command}'`);
			}
			
			console.log(`🎤 Voice command executed: '${command}'`);
		} catch (error) {
			console.error(`❌ Voice command execution failed: '${command}'`, error);
			throw error;
		}
	}

	private async controlDevice(deviceType: string, state: boolean): Promise<void> {
		// This would integrate with the device control system
		console.log(`🎛️ Controlling ${deviceType}: ${state ? 'ON' : 'OFF'}`);
		// In a real implementation, this would call the device control service
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