// Frontend Configuration - Centralized constants and environment management

// Environment Variables (Vite automatically loads these)
interface AppEnv {
	readonly VITE_API_URL: string;
	readonly VITE_WS_URL?: string;
	readonly VITE_APP_TITLE?: string;
	readonly VITE_APP_VERSION?: string;
	readonly VITE_ENABLE_MOCK_DATA?: string;
	readonly VITE_ENABLE_DEBUG?: string;
}

// Type-safe access to environment variables
const getEnv = (): AppEnv => {
	return {
		VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
		VITE_WS_URL: import.meta.env.VITE_WS_URL,
		VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
		VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
		VITE_ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA,
		VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
	};
};

const env = getEnv();

// Application Constants (No more magic numbers!)
export const AppConstants = {
	// API Configuration
	API: {
		BASE_URL: env.VITE_API_URL,
		WS_URL: env.VITE_WS_URL || env.VITE_API_URL,
		TIMEOUT: 30000, // 30 seconds
		RETRY_ATTEMPTS: 3,
		RETRY_DELAY: 1000, // 1 second
	},

	// UI Timing
	UI: {
		TOAST_DURATION_SUCCESS: 4000,
		TOAST_DURATION_ERROR: 7000,
		TOAST_DURATION_WARNING: 6000,
		TOAST_DURATION_INFO: 5000,
		DEBOUNCE_DELAY: 300,
		HIGHLIGHT_DURATION: 2000,
		LOADING_DEBOUNCE: 150,
	},

	// Data Refresh Intervals
	REFRESH: {
		SENSOR_DATA: 5000, // 5 seconds
		DEVICE_STATUS: 10000, // 10 seconds
		ALERTS: 15000, // 15 seconds
		CHART_DATA: 30000, // 30 seconds
		SYSTEM_STATUS: 60000, // 1 minute
	},

	// Chart Configuration
	CHART: {
		MAX_DATA_POINTS: 100,
		TIME_RANGES: {
			'1h': 60 * 60 * 1000,
			'6h': 6 * 60 * 60 * 1000,
			'24h': 24 * 60 * 60 * 1000,
			'7d': 7 * 24 * 60 * 60 * 1000,
			'30d': 30 * 24 * 60 * 60 * 1000,
		},
		COLORS: {
			temperature: '#dc3545',
			humidity: '#007bff',
			soilMoisture: '#28a745',
			lightLevel: '#ffc107',
			waterLevel: '#17a2b8',
		},
	},

	// Pagination
	PAGINATION: {
		DEFAULT_PAGE: 1,
		DEFAULT_LIMIT: 20,
		PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
		MAX_PAGES_DISPLAY: 5,
	},

	// WebSocket Events (must match backend)
	WS_EVENTS: {
		SENSOR_DATA: 'sensorData',
		DEVICE_STATUS: 'deviceStatus',
		ALERT: 'alert',
		VOICE_COMMAND: 'voiceCommand',
		SYSTEM_STATUS: 'systemStatus',
		ERROR: 'error',
		CONNECT: 'connect',
		DISCONNECT: 'disconnect',
	},

	// Device Types (must match backend)
	DEVICE_TYPES: ['light', 'pump', 'door', 'window'] as const,

	// Alert Severities
	ALERT_SEVERITY: {
		LOW: 'low',
		MEDIUM: 'medium',
		HIGH: 'high',
		CRITICAL: 'critical',
	},

	// HTTP Status Codes
	HTTP_STATUS: {
		OK: 200,
		CREATED: 201,
		BAD_REQUEST: 400,
		UNAUTHORIZED: 401,
		FORBIDDEN: 403,
		NOT_FOUND: 404,
		CONFLICT: 409,
		UNPROCESSABLE_ENTITY: 422,
		INTERNAL_SERVER_ERROR: 500,
		SERVICE_UNAVAILABLE: 503,
	},

	// Local Storage Keys
	STORAGE_KEYS: {
		AUTH_TOKEN: 'auth_token',
		USER_DATA: 'user_data',
		MOCK_DATA_ENABLED: 'useMockData',
		CHART_SETTINGS: 'chart_settings',
		DASHBOARD_LAYOUT: 'dashboard_layout',
		THEME_PREFERENCE: 'theme_preference',
	},

	// Form Validation
	VALIDATION: {
		EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		PASSWORD_MIN_LENGTH: 8,
		TEMPERATURE_RANGE: { min: -50, max: 100 },
		HUMIDITY_RANGE: { min: 0, max: 100 },
		SOIL_MOISTURE_RANGE: { min: 0, max: 100 },
		LIGHT_LEVEL_RANGE: { min: 0, max: 10000 },
		WATER_LEVEL_RANGE: { min: 0, max: 100 },
	},

	// Export limits
	MAX_EXPORT_RECORDS: 10000,

	// File Upload
	UPLOAD: {
		MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
		ALLOWED_FILE_TYPES: ['.csv', '.json'],
		ALLOWED_MIME_TYPES: ['text/csv', 'application/json'],
	},
} as const;

// Type-safe configuration object
export const Config = {
	// Application
	app: {
		title: env.VITE_APP_TITLE || 'Smart Greenhouse',
		version: env.VITE_APP_VERSION || '1.0.0',
		isDevelopment: import.meta.env.MODE === 'development',
		isProduction: import.meta.env.MODE === 'production',
		enableMockData: env.VITE_ENABLE_MOCK_DATA === 'true',
		enableDebug: env.VITE_ENABLE_DEBUG === 'true',
	},

	// API
	api: {
		baseUrl: AppConstants.API.BASE_URL,
		wsUrl: AppConstants.API.WS_URL,
		timeout: AppConstants.API.TIMEOUT,
		retryAttempts: AppConstants.API.RETRY_ATTEMPTS,
		retryDelay: AppConstants.API.RETRY_DELAY,
	},

	// Features flags
	features: {
		mockDataToggle: env.VITE_ENABLE_MOCK_DATA === 'true',
		debugMode: env.VITE_ENABLE_DEBUG === 'true',
		voiceCommands: true,
		automation: true,
		emailAlerts: true,
		pushNotifications: false, // Frontend doesn't handle push directly
	},
} as const;

// Helper functions
export const getApiUrl = (endpoint: string): string => {
	const baseUrl = Config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
	const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	return `${baseUrl}/api${cleanEndpoint}`;
};

export const getWebSocketUrl = (): string => {
	// Check if we're in development mode using multiple indicators
	const isDevelopment = import.meta.env.MODE === 'development' ||
		import.meta.env.DEV === true ||
		(typeof window !== 'undefined' && window.location.hostname === 'localhost');
	
	// Get the server URL
	let serverUrl = Config.api.wsUrl;
	
	// Auto-detect WebSocket URL based on current page URL in production
	if (!isDevelopment && typeof window !== 'undefined') {
		const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
		const host = window.location.host;
		serverUrl = `${protocol}//${host}`;
		console.log(`🔌 Production WebSocket URL detected: ${serverUrl}`);
	} else {
		console.log(`🔧 Development WebSocket URL: ${serverUrl}`);
	}
	
	return serverUrl;
};

export const isFeatureEnabled = (feature: keyof typeof Config.features): boolean => {
	return Config.features[feature];
};

// Export types for type safety
export type AppConfig = typeof Config;
export type DeviceType = typeof AppConstants.DEVICE_TYPES[number];
export type WSEvent = keyof typeof AppConstants.WS_EVENTS;

export default Config;