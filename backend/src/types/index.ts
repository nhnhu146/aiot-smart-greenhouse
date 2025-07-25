export interface SensorData {
	_id?: string;
	// Remove timestamp since we use MongoDB's createdAt
	temperature?: number | null;
	humidity?: number | null;
	soilMoisture?: boolean | null;
	waterLevel?: boolean | null;
	plantHeight?: number | null;
	rainStatus?: boolean | null;
	lightLevel?: boolean | null;
	motionDetected?: boolean | null;
	deviceId?: string;
	dataQuality?: 'complete' | 'partial' | 'error';
	createdAt?: Date;
	updatedAt?: Date;
}

export interface DeviceStatus {
	_id?: string;
	deviceId: string;
	deviceType: 'light' | 'pump' | 'door' | 'window' | 'servo';
	status: boolean;
	isOnline?: boolean;
	errorCount?: number;
	lastCommand?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface DeviceControl {
	deviceType: 'light' | 'pump' | 'door' | 'window';
	action: 'on' | 'off' | 'open' | 'close';
	duration?: number; // in seconds, for pump
}

export interface Settings {
	_id?: string;
	temperatureThreshold: {
		min: number;
		max: number;
	};
	humidityThreshold: {
		min: number;
		max: number;
	};
	autoControl: {
		light: boolean;
		pump: boolean;
		door: boolean;
	};
	notifications: {
		email: boolean;
		threshold: boolean;
		emailRecipients: string[];
	};
	emailAlerts: {
		temperature: boolean;
		humidity: boolean;
		soilMoisture: boolean;
		waterLevel: boolean;
	};
	updatedAt?: Date;
}

export interface Alert {
	_id?: string;
	type: 'warning' | 'error' | 'info';
	message: string;
	sensor?: string;
	value?: number;
	threshold?: number;
	resolved: boolean;
	timestamp: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface MQTTTopics {
	SENSORS: {
		TEMPERATURE: 'greenhouse/sensors/temperature';
		HUMIDITY: 'greenhouse/sensors/humidity';
		SOIL: 'greenhouse/sensors/soil';
		WATER: 'greenhouse/sensors/water';
		HEIGHT: 'greenhouse/sensors/height';
		RAIN: 'greenhouse/sensors/rain';
		LIGHT: 'greenhouse/sensors/light';
		MOTION: 'greenhouse/sensors/motion';
	};
	DEVICES: {
		LIGHT_CONTROL: 'greenhouse/devices/light/control';
		PUMP_CONTROL: 'greenhouse/devices/pump/control';
		DOOR_CONTROL: 'greenhouse/devices/door/control';
		WINDOW_CONTROL: 'greenhouse/devices/window/control';
	};
}

export interface APIResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
	timestamp: string;
}
