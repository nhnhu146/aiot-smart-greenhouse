export interface SensorData {
	_id?: string
	// Remove timestamp since we use MongoDB's createdAt
	temperature?: number | null
	humidity?: number | null
	soilMoisture?: number | null; // Binary: 0 = dry, 1 = wet
	waterLevel?: number | null; // Binary: 0 = normal, 1 = flooded
	plantHeight?: number | null
	rainStatus?: number | null; // Binary: 0 = no rain, 1 = raining
	lightLevel?: number | null; // Binary: 0 = dark, 1 = bright
	deviceId?: string
	dataQuality?: 'complete' | 'partial' | 'error'
	createdAt?: Date
	updatedAt?: Date
}

export interface DeviceStatus {
	_id?: string
	deviceId: string
	deviceType: 'light' | 'pump' | 'door' | 'window' | 'servo'
	status: boolean
	isOnline?: boolean
	errorCount?: number
	lastCommand?: string
	createdAt?: Date
	updatedAt?: Date
}

export interface DeviceControl {
	deviceType: 'light' | 'pump' | 'door' | 'window'
	action: 'on' | 'off' | 'open' | 'close'
	duration?: number; // in seconds, for pump
}

export interface Settings {
	_id?: string
	temperatureThreshold: {
		min: number
		max: number
	}
	humidityThreshold: {
		min: number
		max: number
	}
	// Support both old min/max structure and new trigger structure for binary sensors
	soilMoistureThreshold: {
		min?: number
		max?: number
		trigger?: number // Binary sensor: 0 or 1
	}
	waterLevelThreshold: {
		min?: number
		max?: number
		trigger?: number // Binary sensor: 0 or 1
	}
	autoControl: {
		light: boolean
		pump: boolean
		door: boolean
	}
	notifications: {
		email: boolean
		threshold: boolean
		emailRecipients: string[]
		alertFrequency?: number
		batchAlerts?: boolean
	}
	emailAlerts: {
		temperature: boolean
		humidity: boolean
		soilMoisture: boolean
		waterLevel: boolean
	}
	automation?: {
		enabled: boolean
		lightControl: boolean
		pumpControl: boolean
		doorControl: boolean
		windowControl: boolean
		// Automation thresholds
		lightThreshold: number; // 0 = dark (turn on light), 1 = bright (turn off light)
		pumpThreshold: number; // 0 = dry (turn on pump), 1 = wet (turn off pump)
		temperatureThreshold: {
			windowOpen: number; // Temperature to open window
			doorOpen: number; // Temperature to open door (emergency)
		}
		updatedAt: Date
	}
	updatedAt?: Date
}

export interface Alert {
	_id?: string
	type: 'warning' | 'error' | 'info'
	message: string
	sensor?: string
	value?: number
	threshold?: number
	resolved: boolean
	timestamp: Date
	createdAt?: Date
	updatedAt?: Date
}

export interface MQTTTopics {
	SENSORS: {
		TEMPERATURE: 'greenhouse/sensors/temperature'
		HUMIDITY: 'greenhouse/sensors/humidity'
		SOIL: 'greenhouse/sensors/soil'
		WATER: 'greenhouse/sensors/water'
		HEIGHT: 'greenhouse/sensors/height'
		RAIN: 'greenhouse/sensors/rain'
		LIGHT: 'greenhouse/sensors/light'
	}
	DEVICES: {
		LIGHT_CONTROL: 'greenhouse/devices/light/control'
		PUMP_CONTROL: 'greenhouse/devices/pump/control'
		DOOR_CONTROL: 'greenhouse/devices/door/control'
		WINDOW_CONTROL: 'greenhouse/devices/window/control'
	}
}

export interface APIResponse<T = any> {
	success: boolean
	message: string
	data?: T
	error?: string
	timestamp: string
	merged?: boolean // For merged data responses
}