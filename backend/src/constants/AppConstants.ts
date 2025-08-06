/**
 * Application Constants
 * Centralized constants to avoid magic numbers and strings throughout the codebase
 */

export const AppConstants = {
  // Time intervals (in milliseconds)
  CONNECTION_TIMEOUT: 30000,
  REQUEST_TIMEOUT: 15000,
  RETRY_DELAY: 2000,
  DEBOUNCE_DELAY: 500,
  
  // Cooldown periods (in minutes)
  ALERT_COOLDOWN: {
    TEMPERATURE: 10,
    HUMIDITY: 10,
    SOIL_MOISTURE: 15,
    WATER_LEVEL: 5,
    SYSTEM_ERROR: 30
  },
  
  // Database limits
  DATABASE: {
    MAX_RESULTS_PER_PAGE: 100,
    DEFAULT_PAGE_SIZE: 20,
    DATA_RETENTION_DAYS: 90
  },
  
  // MQTT Configuration
  MQTT: {
    MAX_RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY: 5000,
    KEEP_ALIVE: 60
  },
  
  // Email Configuration
  EMAIL: {
    DEFAULT_FREQUENCY_MINUTES: 5,
    MAX_RECIPIENTS: 10,
    TEMPLATE_CACHE_TTL: 3600000 // 1 hour
  },
  
  // Device Control
  DEVICES: {
    SCHEDULED_COMMAND_DELAY_MAX: 300, // 5 minutes
    STATE_SYNC_INTERVAL: 30000 // 30 seconds
  },
  
  // Voice Commands
  VOICE: {
    MIN_CONFIDENCE_THRESHOLD: 0.7,
    MAX_COMMAND_LENGTH: 100
  },
  
  // Sensor Thresholds (defaults)
  SENSOR_DEFAULTS: {
    TEMPERATURE: { min: 20, max: 30 },
    HUMIDITY: { min: 40, max: 80 },
    LIGHT_INTENSITY: { min: 300, max: 1000 }
  },
  
  // WebSocket Events
  WS_EVENTS: {
    SENSOR_DATA: 'sensor:data',
    DEVICE_STATUS: 'device:status',
    DEVICE_CONTROL: 'device:control',
    ALERT: 'alert',
    AUTOMATION_UPDATE: 'automation:update',
    VOICE_COMMAND: 'voice-command'
  },
  
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  },
  
  // Validation Rules
  VALIDATION: {
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 6,
    COMMAND_MAX_LENGTH: 200
  }
} as const;

export default AppConstants;