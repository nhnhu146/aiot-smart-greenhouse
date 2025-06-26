export interface SensorData {
	_id?: string;
	timestamp: Date;
	temperature: number;
	humidity: number;
	soilMoisture: number;
	waterLevel: number;
	plantHeight: number;
	rainStatus: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface DeviceStatus {
	_id?: string;
	deviceId: string;
	deviceType: 'light' | 'pump' | 'door';
	status: boolean;
	lastUpdated: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface DeviceControl {
	deviceType: 'light' | 'pump' | 'door';
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
	soilMoistureThreshold: {
		min: number;
		max: number;
	};
	waterLevelThreshold: {
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
	};
	DEVICES: {
		LIGHT_CONTROL: 'greenhouse/devices/light/control';
		PUMP_CONTROL: 'greenhouse/devices/pump/control';
		DOOR_CONTROL: 'greenhouse/devices/door/control';
	};
}

export interface APIResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
	timestamp: string;
}
