import { z } from 'zod';

// Automation settings schema
export const AutomationConfigSchema = z.object({
	automationEnabled: z.boolean(),
	lightControlEnabled: z.boolean().optional(),
	pumpControlEnabled: z.boolean().optional(),
	doorControlEnabled: z.boolean().optional(),
	windowControlEnabled: z.boolean().optional(),
	lightThresholds: z.object({
		turnOnWhenDark: z.number().min(0).max(1),
		turnOffWhenBright: z.number().min(0).max(1)
	}).optional(),
	pumpThresholds: z.object({
		turnOnWhenDry: z.number().min(0).max(1),
		turnOffWhenWet: z.number().min(0).max(1)
	}).optional(),
	temperatureThresholds: z.object({
		windowOpenTemp: z.number(),
		windowCloseTemp: z.number(),
		doorOpenTemp: z.number(),
		doorCloseTemp: z.number()
	}).optional(),
	rainSettings: z.object({
		autoCloseWindowOnRain: z.boolean(),
		autoOpenAfterRain: z.boolean()
	}).optional(),
	waterLevelSettings: z.object({
		autoTurnOffPumpOnFlood: z.boolean(),
		autoOpenDoorOnFlood: z.boolean()
	}).optional()
});

// Simple toggle schema for API compatibility
export const AutomationToggleSchema = z.object({
	enabled: z.boolean()
});

// Sensor trigger schema
export const SensorTriggerSchema = z.object({
	sensorType: z.string().min(1),
	value: z.number()
});
