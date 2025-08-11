import { z } from 'zod';
export const SensorDataSchema = z.object({
	temperature: z.number().min(-50).max(100),
	humidity: z.number().min(0).max(100),
	soilMoisture: z.number().min(0).max(1), // Binary: 0=dry, 1=wet
	waterLevel: z.number().min(0).max(1), // Binary: 0=empty, 1=full
	lightLevel: z.number().min(0).max(1), // Binary: 0=dark, 1=bright
	plantHeight: z.number().min(0),
	rainStatus: z.number().min(0).max(1), // Binary: 0=no rain, 1=raining
	timestamp: z.date().optional()
});
export const DeviceControlSchema = z.object({
	deviceType: z.enum(['light', 'pump', 'door', 'window']),
	action: z.enum(['on', 'off', 'open', 'close']),
	duration: z.number().min(1).max(3600).optional() // max 1 hour
});
export const SettingsSchema = z.object({
	temperatureThreshold: z.object({
		min: z.number().min(-50).max(50),
		max: z.number().min(-50).max(50)
	}),
	humidityThreshold: z.object({
		min: z.number().min(0).max(100),
		max: z.number().min(0).max(100)
	}),
	soilMoistureThreshold: z.object({
		min: z.number().min(0).max(1), // Binary: 0=dry, 1=wet
		max: z.number().min(0).max(1)
	}),
	waterLevelThreshold: z.object({
		min: z.number().min(0).max(100),
		max: z.number().min(0).max(100)
	}),
	autoControl: z.object({
		light: z.boolean(),
		pump: z.boolean(),
		door: z.boolean()
	}),
	notifications: z.object({
		email: z.boolean(),
		threshold: z.boolean(),
		emailRecipients: z.array(z.string().email()).optional().default([])
	})
});
export const AlertCreateSchema = z.object({
	type: z.enum(['warning', 'error', 'info']),
	message: z.string().min(1).max(500),
	sensor: z.string().optional(),
	value: z.number().optional(),
	threshold: z.number().optional()
});
export const QueryParamsSchema = z.object({
	page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
	limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(10000)).optional(),
	pageSize: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(10000)).optional(),
	format: z.enum(['json', 'csv']).optional(),
	from: z.string().transform(val => new Date(val)).pipe(z.date()).optional(),
	to: z.string().transform(val => new Date(val)).pipe(z.date()).optional(),
	deviceType: z.enum(['light', 'pump', 'door', 'window']).optional(),
	resolved: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
	// Value range filters
	minTemperature: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	maxTemperature: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	minHumidity: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	maxHumidity: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	minSoilMoisture: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	maxSoilMoisture: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	minWaterLevel: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	maxWaterLevel: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	// Specific value filters
	soilMoisture: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	waterLevel: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
	rainStatus: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
	// Control type filter
	controlType: z.enum(['auto', 'manual']).optional(),
	// Sort options - including both sensor and device control fields
	sortBy: z.enum(['createdAt', 'timestamp', 'temperature', 'humidity', 'soilMoisture', 'waterLevel', 'deviceType', 'action', 'status']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional()
});
export type SensorDataInput = z.infer<typeof SensorDataSchema>
export type DeviceControlInput = z.infer<typeof DeviceControlSchema>
export type SettingsInput = z.infer<typeof SettingsSchema>
export type AlertCreateInput = z.infer<typeof AlertCreateSchema>
export type QueryParams = z.infer<typeof QueryParamsSchema>