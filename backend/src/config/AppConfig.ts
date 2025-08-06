import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../../../.env') });
// Environment validation schema
const envSchema = z.object({
	// Core Application
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.string().transform(Number).default('5000'),
	API_PREFIX: z.string().default('/api'),

	// Database
	MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
	REDIS_URL: z.string().default('redis://localhost:6379'),

	// Authentication
	JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
	JWT_EXPIRES_IN: z.string().default('24h'),
	BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

	// MQTT
	MQTT_BROKER_URL: z.string().default('mqtt://mqtt.noboroto.id.vn:1883'),
	MQTT_HOST: z.string().default('mqtt.noboroto.id.vn'),
	MQTT_PORT: z.string().transform(Number).default('1883'),
	MQTT_USERNAME: z.string().optional(),
	MQTT_PASSWORD: z.string().optional(),
	MQTT_CLIENT_ID: z.string().optional(),

	// Email
	EMAIL_ENABLED: z.string().transform(v => v === 'true').default('false'),
	EMAIL_HOST: z.string().default('smtp.gmail.com'),
	EMAIL_PORT: z.string().transform(Number).default('587'),
	EMAIL_SECURE: z.string().transform(v => v === 'true').default('false'),
	EMAIL_USER: z.string().optional(),
	EMAIL_PASS: z.string().optional(),
	EMAIL_FROM: z.string().optional(),

	// WebSocket
	FRONTEND_URL: z.string().default('http://localhost:3000'),
	WEBSOCKET_PING_TIMEOUT: z.string().transform(Number).default('60000'),
	WEBSOCKET_PING_INTERVAL: z.string().transform(Number).default('25000'),

	// CORS
	CORS_ORIGIN: z.string().default('*'),

	// Rate Limiting
	RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
	AUTOMATION_RATE_LIMIT: z.string().transform(Number).default('100'), // Fixed from previous bug

	// Logging
	LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
	LOG_TO_FILE: z.string().transform(v => v === 'true').default('true'),
	LOG_MAX_SIZE: z.string().default('20m'),
	LOG_MAX_FILES: z.string().transform(Number).default('14'),

	// Push Notifications
	PUSHSAFER_PRIVATE_KEY: z.string().optional(),
	PUSH_NOTIFICATIONS_ENABLED: z.string().transform(v => v === 'true').default('false'),

	// Development & Debug
	DEBUG: z.string().optional(),
	MOCK_DATA_ENABLED: z.string().transform(v => v === 'true').default('false'),
});
// Parse and validate environment variables
const parseEnv = () => {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('❌ Environment validation failed:');
			error.errors.forEach(err => {
				console.error(`  - ${err.path.join('.')}: ${err.message}`);
			});
			process.exit(1);
		}
		throw error;
	}
};
export const env = parseEnv();
// Application Constants (No more magic numbers!)
export const AppConstants = {
	// Time intervals (in milliseconds)
	SENSOR_DATA_STALE_THRESHOLD: 5 * 60 * 1000, // 5 minutes
	DEVICE_RESPONSE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
	EMAIL_RETRY_INTERVAL: 30 * 1000, // 30 seconds
	ALERT_DEBOUNCE_TIME: 2 * 60 * 1000, // 2 minutes
	CONNECTION_TIMEOUT: 10 * 1000, // 10 seconds
	PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 hour

	// Data limits
	MAX_SENSOR_RECORDS_PER_QUERY: 1000,
	MAX_ALERT_RECORDS_PER_QUERY: 500,
	MAX_EXPORT_RECORDS: 10000,

	// Default thresholds
	DEFAULT_THRESHOLDS: {
		temperature: { min: 15, max: 35 },
		humidity: { min: 30, max: 80 },
		soilMoisture: { min: 20, max: 80 },
		lightLevel: { min: 200, max: 1000 },
		waterLevel: { min: 10, max: 90 },
	},

	// Device types
	DEVICE_TYPES: ['light', 'pump', 'door', 'window'] as const,

	// MQTT Topics
	MQTT_TOPICS: {
		SENSOR_DATA: 'sensor/data',
		DEVICE_CONTROL: 'device/control',
		DEVICE_STATUS: 'device/status',
		SYSTEM_STATUS: 'system/status',
		VOICE_COMMAND: 'voice/command',
		ALERT: 'alert/trigger',
	},

	// WebSocket Events
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

	// Pagination defaults
	PAGINATION: {
		DEFAULT_PAGE: 1,
		DEFAULT_LIMIT: 20,
		MAX_LIMIT: 100,
	},

	// File upload limits
	UPLOAD: {
		MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
		ALLOWED_MIME_TYPES: ['text/csv', 'application/json'],
	},
} as const;
// Type-safe configuration object
export const Config = {
	// Application
	// Application Constants - Centralized configuration values
	constants: {
		RETRY_ATTEMPTS: 3,
		TIMEOUT_DEFAULT: 5000,
		PAGINATION_LIMIT: 50,
		PAGINATION_MAX: 1000,
		
		// HTTP Status Codes
		HTTP_STATUS: {
			OK: 200,
			CREATED: 201,
			BAD_REQUEST: 400,
			UNAUTHORIZED: 401,
			FORBIDDEN: 403,
			NOT_FOUND: 404,
			CONFLICT: 409,
			INTERNAL_SERVER_ERROR: 500,
			SERVICE_UNAVAILABLE: 503
		},
		
		// Error Messages
		ERROR_MESSAGES: {
			INVALID_CREDENTIALS: 'Invalid email or password',
			UNAUTHORIZED_ACCESS: 'Unauthorized access',
			RESOURCE_NOT_FOUND: 'Resource not found',
			VALIDATION_FAILED: 'Validation failed',
			INTERNAL_SERVER_ERROR: 'Internal server error',
			NETWORK_ERROR: 'Network error occurred',
			DATABASE_ERROR: 'Database error occurred'
		},
		
		// Device Types
		DEVICE_TYPES: {
			LIGHT: 'light',
			PUMP: 'pump', 
			DOOR: 'door',
			WINDOW: 'window'
		},
		
		// Sensor Types
		SENSOR_TYPES: {
			TEMPERATURE: 'temperature',
			HUMIDITY: 'humidity',
			SOIL_MOISTURE: 'soilMoisture',
			WATER_LEVEL: 'waterLevel',
			LIGHT_LEVEL: 'lightLevel'
		},
		
		// Alert Types
		ALERT_TYPES: {
			WARNING: 'warning',
			ERROR: 'error',
			INFO: 'info'
		},
		
		// Data Quality States
		DATA_QUALITY: {
			COMPLETE: 'complete',
			PARTIAL: 'partial',
			ERROR: 'error'
		}
	},
	app: {
		env: env.NODE_ENV,
		port: env.PORT,
		apiPrefix: env.API_PREFIX,
		frontendUrl: env.FRONTEND_URL,
		isProduction: env.NODE_ENV === 'production',
		isDevelopment: env.NODE_ENV === 'development',
		isTest: env.NODE_ENV === 'test',
	},

	// Database
	database: {
		mongoUri: env.MONGODB_URI,
		redisUrl: env.REDIS_URL,
	},

	// Authentication
	auth: {
		jwtSecret: env.JWT_SECRET,
		jwtExpiresIn: env.JWT_EXPIRES_IN,
		bcryptRounds: env.BCRYPT_ROUNDS,
	},

	// MQTT
	mqtt: {
		brokerUrl: env.MQTT_BROKER_URL,
		host: env.MQTT_HOST,
		port: env.MQTT_PORT,
		username: env.MQTT_USERNAME,
		password: env.MQTT_PASSWORD,
		clientId: env.MQTT_CLIENT_ID || `greenhouse-server-${Date.now()}`,
	},

	// Email
	email: {
		enabled: env.EMAIL_ENABLED,
		host: env.EMAIL_HOST,
		port: env.EMAIL_PORT,
		secure: env.EMAIL_SECURE,
		user: env.EMAIL_USER,
		password: env.EMAIL_PASS,
		from: env.EMAIL_FROM || 'Smart Greenhouse <noreply@localhost>',
	},

	// Push Notifications
	pushNotifications: {
		enabled: env.PUSH_NOTIFICATIONS_ENABLED,
		pushsaferPrivateKey: env.PUSHSAFER_PRIVATE_KEY,
	},

	// WebSocket
	websocket: {
		frontendUrl: env.FRONTEND_URL,
		pingTimeout: env.WEBSOCKET_PING_TIMEOUT,
		pingInterval: env.WEBSOCKET_PING_INTERVAL,
	},

	// CORS
	cors: {
		origin: env.CORS_ORIGIN,
	},

	// Rate Limiting
	rateLimit: {
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		automationLimit: env.AUTOMATION_RATE_LIMIT,
	},

	// Logging
	logging: {
		level: env.LOG_LEVEL,
		toFile: env.LOG_TO_FILE,
		maxSize: env.LOG_MAX_SIZE,
		maxFiles: env.LOG_MAX_FILES,
	},

	// Push Notifications
	push: {
		enabled: env.PUSH_NOTIFICATIONS_ENABLED,
		pushsaferKey: env.PUSHSAFER_PRIVATE_KEY,
	},

	// Debug
	debug: {
		namespace: env.DEBUG,
		mockDataEnabled: env.MOCK_DATA_ENABLED,
	},
} as const;
// Export types for type safety
export type AppConfig = typeof Config
export type DeviceType = typeof AppConstants.DEVICE_TYPES[number]
// Validation helper
export const validateRequiredConfig = () => {
	const requiredFields = [
		'MONGODB_URI',
		'JWT_SECRET',
	];
	const missing = requiredFields.filter(field => !process.env[field]);
	if (missing.length > 0) {
		console.error('❌ Missing required environment variables:');
		missing.forEach(field => {
			console.error(`  - ${field}`);
		});
		console.error('\n💡 Please check your .env file or environment configuration');
		process.exit(1);
	}
};
// Initialize configuration
validateRequiredConfig();
export default Config;