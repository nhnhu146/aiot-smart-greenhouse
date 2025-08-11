// -*- coding: utf-8 -*-
/**
 * Standardized WebSocket Event Format
 * All WebSocket events should follow this consistent structure
 */
export interface WebSocketEvent {
	event: string
	data: any
	timestamp: string
	source?: string
}

/**
 * Standardized API Response Format
 * All API responses should follow this consistent structure
 */
export interface StandardAPIResponse<T = any> {
	success: boolean
	message: string
	data?: T
	timestamp: string
	error?: {
		code?: string
		details?: string
	}
}

/**
 * WebSocket Event Types - Standardized naming convention
 */
export const WebSocketEvents = {
	// Connection Events
	CONNECTION_STATUS: 'connection:status',

	// Sensor Data Events  
	SENSOR_DATA: 'sensor:data',
	SENSOR_UPDATE: 'sensor:update',

	// Device Events
	DEVICE_STATUS: 'device:status',
	DEVICE_STATE_UPDATE: 'device:state:update',
	DEVICE_STATE_SYNC: 'device:state:sync',
	DEVICE_CONTROL: 'device:control',

	// Alert Events
	ALERT: 'alert:new',
	ALERT_PRIORITY: 'alert:priority',

	// Voice Command Events
	VOICE_COMMAND: 'voice:command',
	VOICE_COMMAND_HISTORY: 'voice:history',

	// System Events
	SYSTEM_STATUS: 'system:status',
	DATABASE_CHANGE: 'database:change',

	// Automation Events
	AUTOMATION_STATUS: 'automation:status'
} as const;
/**
 * Standard Device Types
 */
export const DeviceTypes = {
	LIGHT: 'light',
	PUMP: 'pump',
	DOOR: 'door',
	WINDOW: 'window'
} as const;
/**
 * Standard Sensor Types
 */
export const SensorTypes = {
	TEMPERATURE: 'temperature',
	HUMIDITY: 'humidity',
	SOIL_MOISTURE: 'soil',
	WATER_LEVEL: 'water',
	LIGHT_LEVEL: 'light',
	PLANT_HEIGHT: 'height',
	RAIN_STATUS: 'rain'
} as const;