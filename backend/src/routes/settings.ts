import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { Settings } from '../models';
import { alertService } from '../services';
import { APIResponse } from '../types';
import { z } from 'zod';

const router = Router();

// Validation schemas
const ThresholdSchema = z.object({
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

const EmailRecipientsSchema = z.object({
	recipients: z.array(z.string().email()).min(1, 'At least one recipient is required')
});

const EmailAlertsSchema = z.object({
	temperature: z.boolean(),
	humidity: z.boolean(),
	soilMoisture: z.boolean(),
	waterLevel: z.boolean()
});

/**
 * @route GET /api/settings - Get current settings
 * @desc Retrieve current system settings including thresholds and email config
 * @access Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
	try {
		const settings = await Settings.findOne().lean();

		const response: APIResponse = {
			success: true,
			data: settings || {
				temperatureThreshold: { min: 18, max: 30 },
				humidityThreshold: { min: 40, max: 80 },
				soilMoistureThreshold: { min: 30, max: 70 },
				waterLevelThreshold: { min: 20, max: 90 },
				autoControl: { light: true, pump: true, door: true },
				notifications: { email: true, threshold: true, emailRecipients: [] },
				emailAlerts: { temperature: true, humidity: true, soilMoisture: true, waterLevel: true }
			},
			message: 'Settings retrieved successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('Error retrieving settings:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve settings',
			timestamp: new Date().toISOString()
		});
	}
}));

/**
 * @route POST /api/settings/thresholds - Update alert thresholds
 * @desc Update sensor alert thresholds
 * @access Public
 */
router.post('/thresholds', asyncHandler(async (req: Request, res: Response) => {
	const validatedData = ThresholdSchema.parse(req.body);

	await Settings.findOneAndUpdate(
		{},
		{ $set: validatedData },
		{ upsert: true, new: true }
	);

	// Reload alert service thresholds
	await alertService.reloadThresholds();

	const response: APIResponse = {
		success: true,
		data: validatedData,
		message: 'Alert thresholds updated successfully',
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

/**
 * @route POST /api/settings/email-recipients - Update email recipients
 * @desc Update email alert recipients
 * @access Public
 */
router.post('/email-recipients', asyncHandler(async (req: Request, res: Response) => {
	const { recipients } = EmailRecipientsSchema.parse(req.body);

	const settings = await Settings.findOneAndUpdate(
		{},
		{
			$set: {
				'notifications.emailRecipients': recipients,
				'notifications.email': true
			}
		},
		{ upsert: true, new: true }
	);

	// Reload alert service email recipients
	await alertService.reloadThresholds();

	const response: APIResponse = {
		success: true,
		data: { recipients: settings.notifications?.emailRecipients || [] },
		message: 'Email recipients updated successfully',
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

/**
 * @route POST /api/settings/email-alerts - Update email alert configuration
 * @desc Configure which types of alerts should trigger emails
 * @access Public
 */
router.post('/email-alerts', asyncHandler(async (req: Request, res: Response) => {
	const emailAlerts = EmailAlertsSchema.parse(req.body);

	const settings = await Settings.findOneAndUpdate(
		{},
		{ $set: { emailAlerts } },
		{ upsert: true, new: true }
	);

	// Reload alert service
	await alertService.reloadThresholds();

	const response: APIResponse = {
		success: true,
		data: { emailAlerts: settings.emailAlerts },
		message: 'Email alert settings updated successfully',
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

/**
 * @route POST /api/settings - Save complete settings
 * @desc Save all system settings at once
 * @access Public
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
	const {
		temperatureThreshold,
		humidityThreshold,
		soilMoistureThreshold,
		waterLevelThreshold,
		autoControl,
		notifications,
		emailAlerts
	} = req.body;

	const settingsData: any = {};

	if (temperatureThreshold) settingsData.temperatureThreshold = temperatureThreshold;
	if (humidityThreshold) settingsData.humidityThreshold = humidityThreshold;
	if (soilMoistureThreshold) settingsData.soilMoistureThreshold = soilMoistureThreshold;
	if (waterLevelThreshold) settingsData.waterLevelThreshold = waterLevelThreshold;
	if (autoControl) settingsData.autoControl = autoControl;
	if (notifications) settingsData.notifications = notifications;
	if (emailAlerts) settingsData.emailAlerts = emailAlerts;

	const settings = await Settings.findOneAndUpdate(
		{},
		{ $set: settingsData },
		{ upsert: true, new: true }
	);

	// Reload alert service
	await alertService.reloadThresholds();

	const response: APIResponse = {
		success: true,
		data: settings,
		message: 'Settings saved successfully',
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

/**
 * @route POST /api/settings/test-email - Send test email
 * @desc Send a test email to verify email configuration
 * @access Public
 */
router.post('/test-email', asyncHandler(async (req: Request, res: Response) => {
	const { recipients } = EmailRecipientsSchema.parse(req.body);

	const success = await alertService.testEmailAlert();

	if (success) {
		const response: APIResponse = {
			success: true,
			message: `Test email sent successfully to ${recipients.length} recipients`,
			data: { recipients },
			timestamp: new Date().toISOString()
		};
		res.json(response);
	} else {
		res.status(400).json({
			success: false,
			message: 'Failed to send test email - Email service may not be configured',
			timestamp: new Date().toISOString()
		});
	}
}));

/**
 * @route GET /api/settings/email-status - Get email service status
 * @desc Get current email service configuration status
 * @access Public
 */
router.get('/email-status', asyncHandler(async (req: Request, res: Response) => {
	const status = alertService.getEmailStatus();

	const response: APIResponse = {
		success: true,
		data: status,
		message: 'Email service status retrieved successfully',
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

/**
 * @route POST /api/settings/reset - Reset to default settings
 * @desc Reset all settings to default values
 * @access Public
 */
router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
	const defaultSettings = {
		temperatureThreshold: { min: 18, max: 30 },
		humidityThreshold: { min: 40, max: 80 },
		soilMoistureThreshold: { min: 30, max: 70 },
		waterLevelThreshold: { min: 20, max: 90 },
		autoControl: { light: true, pump: true, door: true },
		notifications: { email: false, threshold: true, emailRecipients: [] },
		emailAlerts: { temperature: true, humidity: true, soilMoisture: true, waterLevel: true }
	};

	const settings = await Settings.findOneAndUpdate(
		{},
		{ $set: defaultSettings },
		{ upsert: true, new: true }
	);

	// Reload alert service
	await alertService.reloadThresholds();

	const response: APIResponse = {
		success: true,
		data: settings,
		message: 'Settings reset to defaults successfully',
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

export default router;
