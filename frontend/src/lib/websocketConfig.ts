/**
 * Environment Configuration Helper for WebSocket Connections
 * Provides better error handling and connection management
 */

export const getWebSocketUrl = (): string => {
	// Check if we're in development mode
	const isDevelopment = import.meta.env.MODE === 'development';

	// Get the API URL from environment
	let serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

	// In development, provide helpful fallbacks
	if (isDevelopment) {
		// Try to detect if we're running in Docker or local development
		if (typeof window !== 'undefined') {
			const hostname = window.location.hostname;

			// If we're accessing via localhost but API URL is set to a different host
			if (hostname === 'localhost' && !serverUrl.includes('localhost')) {
				serverUrl = 'http://localhost:5000';
			}
		}
	}

	return serverUrl;
};

export const getWebSocketConfig = () => ({
	transports: ['websocket', 'polling'],
	timeout: 5000,
	retries: 3,
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	forceNew: true,
	autoConnect: false,
	// Add ping/pong for connection health
	pingTimeout: 60000,
	pingInterval: 25000
});

export const logConnectionInfo = (serverUrl: string) => {
	console.log(`\n🔗 WebSocket Connection Info
		- Server URL: ${serverUrl}
		- Environment: ${import.meta.env.MODE}
		- WebSocket Config: ${JSON.stringify(getWebSocketConfig(), null, 2)}
		- Timestamp: ${new Date().toISOString()}`);
	
	if (import.meta.env.MODE === 'development') {
		console.log('   - Make sure backend server is running: npm run dev (in backend folder)');
	}
};
