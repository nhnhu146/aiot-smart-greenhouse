export interface SensorData {
	type: string
	value: number
	timestamp: string
	quality?: 'good' | 'fair' | 'poor'
}

export interface DeviceStatus {
	device: string
	status: string
	timestamp: string
}

export interface AlertData {
	id: string
	type: string
	level: string
	message: string
	timestamp: string
}

export interface DeviceControlData {
	controlId: string
	deviceType: string
	action: string
	status: boolean
	source: string
	timestamp: string
	success: boolean
}

export interface VoiceCommandData {
	id: string
	command: string
	confidence: number | null
	timestamp: string
	processed: boolean
	errorMessage?: string
}

export interface SystemStatus {
	mqtt: boolean
	database: boolean
	email: boolean
	timestamp: string
}

export interface AutomationStatus {
	enabled: boolean
	lastUpdate: string
	activeControls: {
		light: boolean
		pump: boolean
		door: boolean
		window: boolean
	}
}

export interface ConnectionStats {
	connectedClients: number
	clientIds: string[]
	isActive: boolean
}
