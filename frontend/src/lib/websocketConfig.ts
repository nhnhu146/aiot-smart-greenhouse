/**
 * Environment Configuration Helper for WebSocket Connections
 * Provides better error handling and connection management
 */

export const getWebSocketUrl = (): string => {
	// Check if we're in development mode using multiple indicators
	const isDevelopment = import.meta.env.MODE === 'development' ||
		import.meta.env.DEV === true ||
		(typeof window !== 'undefined' && window.location.hostname === 'localhost');

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
	timeout: 20000, // Increased timeout
	retries: 3,
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	forceNew: false,
	autoConnect: true,
	// Connection health settings
	pingTimeout: 60000,
	pingInterval: 25000,
	// Additional reliability settings
	upgrade: true,
	rememberUpgrade: true
});

export const logConnectionInfo = (serverUrl: string) => {
	// More accurate environment detection
	const isDev = import.meta.env.MODE === 'development' ||
		import.meta.env.DEV === true ||
		(typeof window !== 'undefined' && window.location.hostname === 'localhost');

	const environment = isDev ? 'development' : 'production';

	// Only log in development mode to reduce console output
	if (environment === 'development') {
		// Suppress logging to reduce console output
		// serverUrl is available for debugging if needed
		void serverUrl; // Acknowledge parameter usage
	}
};
