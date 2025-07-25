import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware';
import { Settings } from '../models';
import { APIResponse } from '../types';

const router = Router();

// Automation settings schema
const AutomationConfigSchema = z.object({
	enabled: z.boolean(),
	lightControl: z.boolean().optional(),
	pumpControl: z.boolean().optional(),
	doorControl: z.boolean().optional(),
	windowControl: z.boolean().optional(),
	thresholds: z.object({
		lightLevel: z.number().min(0).max(1).optional(), // Binary: 0=dark, 1=bright
		soilMoisture: z.number().min(0).max(1).optional(), // Binary: 0=dry, 1=wet
		temperature: z.object({
			min: z.number(),
			max: z.number()
		}).optional(),
		humidity: z.object({
			min: z.number(),
			max: z.number()
		}).optional()
	}).optional()
});

/**
 * @route GET /api/automation - Get automation configuration
 * @desc Retrieve current automation settings
 * @access Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
	try {
		const settings = await Settings.findOne().lean();

		const automationConfig = {
			enabled: settings?.automation?.enabled ?? true,
			lightControl: settings?.automation?.lightControl ?? true,
			pumpControl: settings?.automation?.pumpControl ?? true,
			doorControl: settings?.automation?.doorControl ?? false,
			windowControl: settings?.automation?.windowControl ?? false,
			thresholds: {
				lightLevel: 0, // Turn on light when dark (0)
				soilMoisture: 0, // Turn on pump when dry (0)
				temperature: settings?.temperatureThreshold ?? { min: 18, max: 30 },
				humidity: settings?.humidityThreshold ?? { min: 40, max: 80 }
			}
		};

		const response: APIResponse = {
			success: true,
			data: automationConfig,
			message: 'Automation configuration retrieved successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('Error getting automation config:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to get automation configuration',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

/**
 * @route PUT /api/automation - Update automation configuration
 * @desc Update automation settings
 * @access Public
 */
router.put('/', asyncHandler(async (req: Request, res: Response) => {
	try {
		const validatedData = AutomationConfigSchema.parse(req.body);

		// Update settings in database
		await Settings.findOneAndUpdate(
			{},
			{
				$set: {
					automation: {
						enabled: validatedData.enabled,
						lightControl: validatedData.lightControl ?? true,
						pumpControl: validatedData.pumpControl ?? true,
						doorControl: validatedData.doorControl ?? false,
						windowControl: validatedData.windowControl ?? false,
						updatedAt: new Date()
					},
					...(validatedData.thresholds?.temperature && {
						temperatureThreshold: validatedData.thresholds.temperature
					}),
					...(validatedData.thresholds?.humidity && {
						humidityThreshold: validatedData.thresholds.humidity
					})
				}
			},
			{ upsert: true, new: true }
		);

		console.log(`⚙️ Automation configuration updated:`, validatedData);

		const response: APIResponse = {
			success: true,
			data: validatedData,
			message: 'Automation configuration updated successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('Error updating automation config:', error);
		const response: APIResponse = {
			success: false,
			message: error instanceof z.ZodError ? 'Invalid automation configuration' : 'Failed to update automation configuration',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

/**
 * @route GET /api/automation/status - Get current automation status
 * @desc Get real-time automation status and last actions
 * @access Public
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
	try {
		const settings = await Settings.findOne().lean();

		const status = {
			enabled: settings?.automation?.enabled ?? true,
			lastUpdate: settings?.automation?.updatedAt ?? new Date(),
			activeControls: {
				light: settings?.automation?.lightControl ?? true,
				pump: settings?.automation?.pumpControl ?? true,
				door: settings?.automation?.doorControl ?? false,
				window: settings?.automation?.windowControl ?? false
			}
		};

		const response: APIResponse = {
			success: true,
			data: status,
			message: 'Automation status retrieved successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('Error getting automation status:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to get automation status',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

export default router;
