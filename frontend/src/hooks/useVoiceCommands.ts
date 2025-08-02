import { useState, useEffect } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

export interface VoiceCommand {
	_id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

export const useVoiceCommands = () => {
	const [latestVoiceCommand, setLatestVoiceCommand] = useState<VoiceCommand | null>(null);
	const { socket } = useWebSocket();

	// WebSocket listener for real-time voice command updates
	useEffect(() => {
		if (socket) {
			const handleVoiceCommand = (data: VoiceCommand) => {
				setLatestVoiceCommand(data);
			};

			socket.on("voice-command", handleVoiceCommand);
			socket.on("voice-command-history", handleVoiceCommand);

			return () => {
				socket.off("voice-command", handleVoiceCommand);
				socket.off("voice-command-history", handleVoiceCommand);
			};
		}
	}, [socket]);

	// Format timestamp for display
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) {
			return timestamp;
		}
		return date.toLocaleString("en-GB", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	return {
		latestVoiceCommand,
		formatDateTime
	};
};
