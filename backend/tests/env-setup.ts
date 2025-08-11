// Test environment setup - Must run before any imports
// Mock environment variables for test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.API_PREFIX = '/api';

// Database
process.env.MONGODB_URI = 'mongodb://localhost:27017/greenhouse-test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Authentication
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '10';

// MQTT
process.env.MQTT_BROKER_URL = 'mqtt://test:1883';
process.env.MQTT_HOST = 'localhost';
process.env.MQTT_PORT = '1883';

// Email
process.env.EMAIL_ENABLED = 'false';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_SECURE = 'false';

// WebSocket
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.WEBSOCKET_PING_TIMEOUT = '60000';
process.env.WEBSOCKET_PING_INTERVAL = '25000';

// CORS
process.env.CORS_ORIGIN = '*';

// Rate Limiting
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.AUTOMATION_RATE_LIMIT = '100';

// Logging
process.env.LOG_LEVEL = 'error';
process.env.LOG_TO_FILE = 'false';
process.env.LOG_MAX_SIZE = '20m';
process.env.LOG_MAX_FILES = '5';

// Push Notifications
process.env.PUSH_NOTIFICATIONS_ENABLED = 'false';

// Debug
process.env.MOCK_DATA_ENABLED = 'false';
