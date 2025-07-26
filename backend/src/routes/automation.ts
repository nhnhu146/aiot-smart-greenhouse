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

// Simple toggle schema for API compatibility
const AutomationToggleSchema = z.object({
	enabled: z.boolean()
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

		// Ensure AutomationService is loaded with latest config
		const { automationService } = await import('../services');
		await automationService.reloadConfiguration();

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

		// ✅ CRITICAL: Reload automation service configuration immediately
		const { automationService } = await import('../services');
		await automationService.reloadConfiguration();

		// ✅ CRITICAL: Trigger immediate automation check with new settings
		// This ensures that if thresholds changed, automation responds immediately
		if (settings.automationEnabled) {
			await automationService.processImmediateAutomationCheck();
			console.log('⚡ Immediate automation check triggered after config update');
		}

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
 * @route POST /api/automation/toggle - Toggle automation on/off
 * @desc Toggle automation enabled state for frontend compatibility
 * @access Public
 */
router.post('/toggle', asyncHandler(async (req: Request, res: Response) => {
	try {
		const { automationService } = await import('../services');
		const success = await automationService.toggleAutomation();

		if (success) {
			const settings = await AutomationSettings.findOne();

			const response: APIResponse = {
				success: true,
				data: { enabled: settings?.automationEnabled ?? false },
				message: `Automation ${settings?.automationEnabled ? 'enabled' : 'disabled'} successfully`,
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} else {
			throw new Error('Failed to toggle automation');
		}
	} catch (error) {
		console.error('[AUTOMATION-TOGGLE] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to toggle automation',
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
		const { automationService } = await import('../services');
		const status = automationService.getAutomationStatus();

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

		// ✅ CRITICAL: Reload the AutomationService with new configuration
		const { automationService } = await import('../services');
		await automationService.reloadConfiguration();

		// Trigger immediate automation check with reset settings
		if (defaultSettings.automationEnabled) {
			await automationService.processImmediateAutomationCheck();
		}

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
