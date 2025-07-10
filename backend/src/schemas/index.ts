import { z } from 'zod';

export const SensorDataSchema = z.object({
	temperature: z.number().min(-50).max(100),
	humidity: z.number().min(0).max(100),
	soilMoisture: z.number().min(0).max(100),
	waterLevel: z.number().min(0).max(100),
	plantHeight: z.number().min(0),
	rainStatus: z.boolean(),
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
		min: z.number().min(0).max(100),
		max: z.number().min(0).max(100)
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
	limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
	from: z.string().transform(val => new Date(val)).pipe(z.date()).optional(),
	to: z.string().transform(val => new Date(val)).pipe(z.date()).optional(),
	deviceType: z.enum(['light', 'pump', 'door', 'window']).optional(),
	resolved: z.string().transform(val => val === 'true').pipe(z.boolean()).optional()
});

export type SensorDataInput = z.infer<typeof SensorDataSchema>;
export type DeviceControlInput = z.infer<typeof DeviceControlSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;
export type AlertCreateInput = z.infer<typeof AlertCreateSchema>;
export type QueryParams = z.infer<typeof QueryParamsSchema>;
