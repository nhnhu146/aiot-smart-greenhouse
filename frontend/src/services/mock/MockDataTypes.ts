/**
 * Type definitions for mock data structures
 * Centralized interface definitions
 */

export interface SensorData {
	humidity: number;
	soilMoisture: number;
	temperature: number;
	timestamp?: string;
}

export interface ChartDataPoint {
	time: string;
	temperature: number;
	humidity: number;
	soilMoisture: number;
	waterLevel?: number;
	lightLevel?: number;
	plantHeight?: number;
	rainStatus?: number | boolean;
}

export interface DeviceControl {
	_id: string;
	deviceId: string;
	deviceType: 'light' | 'pump' | 'door' | 'window';
	action: 'on' | 'off' | 'open' | 'close';
	status: boolean;
	controlType: 'auto' | 'manual';
	triggeredBy?: string;
	userId?: string;
	timestamp: string;
	success: boolean;
}
