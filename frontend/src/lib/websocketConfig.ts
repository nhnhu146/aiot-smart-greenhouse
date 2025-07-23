/**
 * Environment Configuration Helper for WebSocket Connections
 * Provides better error handling and connection management
 */

export const getWebSocketUrl = (): string => {
	// Check if we're in development mode
	const isDevelopment = process.env.NODE_ENV === 'development';

	// Get the API URL from environment
	let serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

	// In development, provide helpful fallbacks
	if (isDevelopment) {
		// Try to detect if we're running in Docker or local development
		if (typeof window !== 'undefined') {
			const hostname = window.location.hostname;

			// If we're accessing via localhost but API URL is set to a different host
			if (hostname === 'localhost' && !serverUrl.includes('localhost')) {
				console.warn('⚠️ Development mode: Frontend on localhost but API URL is not localhost');
				console.info('💡 Falling back to localhost:5000 for WebSocket connection');
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
	console.log('🔌 WebSocket Configuration:');
	console.log(`   Server URL: ${serverUrl}`);
	console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`   Transport: WebSocket + Polling fallback`);

	if (process.env.NODE_ENV === 'development') {
		console.log('💡 Development Tips:');
		console.log('   - Make sure backend server is running: npm run dev (in backend folder)');
		console.log('   - Backend should be accessible at: http://localhost:5000');
		console.log('   - Check backend logs for WebSocket initialization');
	}
};
