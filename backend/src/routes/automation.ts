import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware';
import { AutomationSettings } from '../models';
import { APIResponse } from '../types';

const router = Router();

// Automation settings schema
const AutomationConfigSchema = z.object({
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
	motionSettings: z.object({
		autoOpenDoorOnMotion: z.boolean(),
		autoCloseAfterMotion: z.boolean(),
		motionTimeoutMinutes: z.number().min(1).max(60)
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

/**
 * @route GET /api/automation - Get automation configuration
 * @desc Retrieve current automation settings
 * @access Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
	try {
		let settings = await AutomationSettings.findOne();

		// Create default settings if none exist
		if (!settings) {
			settings = new AutomationSettings();
			await settings.save();
		}

		const response: APIResponse = {
			success: true,
			data: settings,
			message: 'Automation configuration retrieved successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('[AUTOMATION-GET] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to retrieve automation configuration',
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

		let settings = await AutomationSettings.findOne();

		if (!settings) {
			settings = new AutomationSettings();
		}

		// Update all fields
		Object.assign(settings, validatedData);

		await settings.save();

		console.log(`⚙️ Automation configuration updated:`, validatedData);

		const response: APIResponse = {
			success: true,
			data: settings,
			message: 'Automation configuration updated successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('[AUTOMATION-PUT] Error:', error);
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
		const settings = await AutomationSettings.findOne();

		const status = {
			enabled: settings?.automationEnabled ?? false,
			lastUpdate: settings?.updatedAt ?? new Date(),
			activeControls: {
				light: settings?.lightControlEnabled ?? true,
				pump: settings?.pumpControlEnabled ?? true,
				door: settings?.doorControlEnabled ?? false,
				window: settings?.windowControlEnabled ?? true
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
		console.error('[AUTOMATION-STATUS] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to get automation status',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

/**
 * @route POST /api/automation/reset - Reset to default settings
 * @desc Reset automation settings to defaults
 * @access Public
 */
router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
	try {
		await AutomationSettings.deleteMany({});
		const defaultSettings = new AutomationSettings();
		await defaultSettings.save();

		const response: APIResponse = {
			success: true,
			data: defaultSettings,
			message: 'Automation settings reset to defaults',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('[AUTOMATION-RESET] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to reset automation settings',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

export default router;
