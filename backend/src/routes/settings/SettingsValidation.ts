import { z } from 'zod';

/**
 * Validation schemas for settings endpoints
 * Centralized validation logic for all settings-related operations
 */

export const ThresholdSchema = z.object({
	temperatureThreshold: z.object({
		min: z.number().min(-50).max(100),
		max: z.number().min(-50).max(100)
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
	})
});

export const EmailRecipientsSchema = z.object({
	recipients: z.array(z.string().email()).min(1, 'At least one recipient is required')
});

export const EmailAlertsSchema = z.object({
	temperature: z.boolean(),
	humidity: z.boolean(),
	soilMoisture: z.boolean(),
	waterLevel: z.boolean()
});

export const AlertFrequencySchema = z.object({
	alertFrequency: z.number().min(1).max(60),
	batchAlerts: z.boolean()
});

/**
 * Validate alert frequency input
 */
export const validateAlertFrequency = (alertFrequency: number): string | null => {
	if (!alertFrequency || alertFrequency < 1 || alertFrequency > 60) {
		return 'Alert frequency must be between 1 and 60 minutes';
	}
	return null;
};
