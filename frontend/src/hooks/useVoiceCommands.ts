import { useWebSocketContext } from '@/contexts/WebSocketContext';

export interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

export const useVoiceCommands = () => {
	const { latestVoiceCommand: contextVoiceCommand } = useWebSocketContext();

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
		latestVoiceCommand: contextVoiceCommand,
		formatDateTime
	};
};
