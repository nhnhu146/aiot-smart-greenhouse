// WebSocket Configuration - Centralized through AppConfig
import { getWebSocketUrl as configGetWebSocketUrl } from '../config/AppConfig';

export const getWebSocketUrl = (): string => {
	return configGetWebSocketUrl();
};

export const getWebSocketConfig = () => {
	return {
		forceNew: false,
		reconnection: true,
		timeout: 20000,
		transports: ['websocket', 'polling'],
		upgrade: true,
		rememberUpgrade: true
	};
};

export const logConnectionInfo = (serverUrl: string) => {
	console.log(`🔌 Connecting to WebSocket server: ${serverUrl}`);
};