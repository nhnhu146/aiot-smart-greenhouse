import { createContext, useContext, ReactNode } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	errorMessage?: string;
}

interface WebSocketContextType {
	socket: any;
	isConnected: boolean;
	sensorData: any;
	persistentSensorData: any;
	deviceStatus: any;
	alerts: any[];
	sendDeviceControl: (device: string, action: string, value?: any) => Promise<any>;
	clearAlerts: () => void;
	latestVoiceCommand: VoiceCommand | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
	children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
	const webSocket = useWebSocket();

	return (
		<WebSocketContext.Provider value={webSocket}>
			{children}
		</WebSocketContext.Provider>
	);
}

export function useWebSocketContext() {
	const context = useContext(WebSocketContext);
	if (context === undefined) {
		throw new Error('useWebSocketContext must be used within a WebSocketProvider');
	}
	return context;
}
