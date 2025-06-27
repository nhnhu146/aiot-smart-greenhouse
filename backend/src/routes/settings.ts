import { Router, Request, Response } from 'express';
import { Settings, SensorData } from '../models';
import { validateBody, asyncHandler, AppError } from '../middleware';
import { SettingsSchema } from '../schemas';
import { APIResponse } from '../types';

const router = Router();

// GET /api/settings - Lấy cài đặt hiện tại
router.get('/', asyncHandler(async (req: Request, res: Response) => {
	let settings = await Settings.findOne().lean();

	// If no settings exist, create default settings
	if (!settings) {
		const defaultSettings = new Settings({
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 30, max: 70 },
			waterLevelThreshold: { min: 20, max: 90 },
			autoControl: { light: true, pump: true, door: true },
			notifications: { email: true, threshold: true }
		});

		settings = await defaultSettings.save() as any;
	}

	const response: APIResponse = {
		success: true,
		message: 'Settings retrieved successfully',
		data: settings,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// POST /api/settings - Cập nhật cài đặt
router.post('/', validateBody(SettingsSchema), asyncHandler(async (req: Request, res: Response) => {
	const settingsData = req.body;

	// Validate threshold ranges
	const { temperatureThreshold, humidityThreshold, soilMoistureThreshold, waterLevelThreshold } = settingsData;

	if (temperatureThreshold.min >= temperatureThreshold.max) {
		throw new AppError('Temperature minimum threshold must be less than maximum', 400);
	}

	if (humidityThreshold.min >= humidityThreshold.max) {
		throw new AppError('Humidity minimum threshold must be less than maximum', 400);
	}

	if (soilMoistureThreshold.min >= soilMoistureThreshold.max) {
		throw new AppError('Soil moisture minimum threshold must be less than maximum', 400);
	}

	if (waterLevelThreshold.min >= waterLevelThreshold.max) {
		throw new AppError('Water level minimum threshold must be less than maximum', 400);
	}

	// Update or create settings
	const settings = await Settings.findOneAndUpdate(
		{},
		settingsData,
		{ upsert: true, new: true, runValidators: true }
	);

	const response: APIResponse = {
		success: true,
		message: 'Settings updated successfully',
		data: settings,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// PUT /api/settings - Cập nhật cài đặt (alias cho POST)
router.put('/', validateBody(SettingsSchema), asyncHandler(async (req: Request, res: Response) => {
	const settingsData = req.body;

	// Validate threshold ranges
	const { temperatureThreshold, humidityThreshold, soilMoistureThreshold, waterLevelThreshold } = settingsData;

	if (temperatureThreshold.min >= temperatureThreshold.max) {
		throw new AppError('Temperature minimum threshold must be less than maximum', 400);
	}

	if (humidityThreshold.min >= humidityThreshold.max) {
		throw new AppError('Humidity minimum threshold must be less than maximum', 400);
	}

	if (soilMoistureThreshold.min >= soilMoistureThreshold.max) {
		throw new AppError('Soil moisture minimum threshold must be less than maximum', 400);
	}

	if (waterLevelThreshold.min >= waterLevelThreshold.max) {
		throw new AppError('Water level minimum threshold must be less than maximum', 400);
	}

	const settings = await Settings.findOneAndUpdate(
		{},
		settingsData,
		{ upsert: true, new: true, runValidators: true }
	);

	const response: APIResponse = {
		success: true,
		message: 'Settings updated successfully',
		data: settings,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// PATCH /api/settings - Cập nhật một phần cài đặt
router.patch('/', asyncHandler(async (req: Request, res: Response) => {
	const partialSettings = req.body;

	const settings = await Settings.findOneAndUpdate(
		{},
		{ $set: partialSettings },
		{ upsert: true, new: true, runValidators: true }
	);

	const response: APIResponse = {
		success: true,
		message: 'Settings partially updated successfully',
		data: settings,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// POST /api/settings/reset - Reset về cài đặt mặc định
router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
	const defaultSettings = {
		temperatureThreshold: { min: 18, max: 30 },
		humidityThreshold: { min: 40, max: 80 },
		soilMoistureThreshold: { min: 30, max: 70 },
		waterLevelThreshold: { min: 20, max: 90 },
		autoControl: { light: true, pump: true, door: true },
		notifications: { email: true, threshold: true }
	};

	const settings = await Settings.findOneAndUpdate(
		{},
		defaultSettings,
		{ upsert: true, new: true, runValidators: true }
	);

	const response: APIResponse = {
		success: true,
		message: 'Settings reset to default successfully',
		data: settings,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/settings/backup - Backup cài đặt hiện tại
router.get('/backup', asyncHandler(async (req: Request, res: Response) => {
	const settings = await Settings.findOne().lean();

	if (!settings) {
		throw new AppError('No settings found to backup', 404);
	}

	const backup = {
		backupTime: new Date().toISOString(),
		version: '1.0.0',
		settings: settings
	};

	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Content-Disposition', `attachment; filename=settings-backup-${Date.now()}.json`);
	res.json(backup);
}));

// POST /api/settings/restore - Restore cài đặt từ backup
router.post('/restore', asyncHandler(async (req: Request, res: Response) => {
	const { settings: backupSettings } = req.body;

	if (!backupSettings) {
		throw new AppError('No settings data provided for restore', 400);
	}

	// Validate backup settings structure
	const requiredFields = ['temperatureThreshold', 'humidityThreshold', 'soilMoistureThreshold', 'waterLevelThreshold', 'autoControl', 'notifications'];
	const missingFields = requiredFields.filter(field => !backupSettings[field]);

	if (missingFields.length > 0) {
		throw new AppError(`Missing required fields in backup: ${missingFields.join(', ')}`, 400);
	}

	// Create new settings from backup (excluding _id and timestamps)
	const { _id, createdAt, updatedAt, __v, ...settingsData } = backupSettings;

	const restoredSettings = await Settings.findOneAndUpdate(
		{},
		settingsData,
		{ upsert: true, new: true, runValidators: true }
	);

	const response: APIResponse = {
		success: true,
		message: 'Settings restored successfully from backup',
		data: restoredSettings,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/settings/validate - Validate current settings
router.get('/validate', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const settings = await Settings.findOne().lean();

	if (!settings) {
		const response: APIResponse = {
			success: false,
			message: 'No settings found',
			timestamp: new Date().toISOString()
		};
		res.status(404).json(response);
		return;
	}

	const validation = {
		isValid: true,
		warnings: [] as string[],
		errors: [] as string[]
	};

	// Check threshold ranges
	if (settings.temperatureThreshold.min >= settings.temperatureThreshold.max) {
		validation.isValid = false;
		validation.errors.push('Temperature minimum threshold must be less than maximum');
	}

	if (settings.humidityThreshold.min >= settings.humidityThreshold.max) {
		validation.isValid = false;
		validation.errors.push('Humidity minimum threshold must be less than maximum');
	}

	if (settings.soilMoistureThreshold.min >= settings.soilMoistureThreshold.max) {
		validation.isValid = false;
		validation.errors.push('Soil moisture minimum threshold must be less than maximum');
	}

	if (settings.waterLevelThreshold.min >= settings.waterLevelThreshold.max) {
		validation.isValid = false;
		validation.errors.push('Water level minimum threshold must be less than maximum');
	}

	// Check for potential warnings
	if (settings.temperatureThreshold.max > 40) {
		validation.warnings.push('High temperature threshold may be dangerous for plants');
	}

	if (settings.temperatureThreshold.min < 0) {
		validation.warnings.push('Low temperature threshold may be dangerous for plants');
	}

	if (settings.waterLevelThreshold.min < 10) {
		validation.warnings.push('Very low water level threshold may cause pump damage');
	}

	const response: APIResponse = {
		success: true,
		message: validation.isValid ? 'Settings validation passed' : 'Settings validation failed',
		data: {
			validation,
			settings
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/settings/recommendations - Get optimization recommendations
router.get('/recommendations', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const settings = await Settings.findOne().lean();
	const latestSensor = await SensorData.findOne().sort({ timestamp: -1 }).lean();

	if (!settings || !latestSensor) {
		const response: APIResponse = {
			success: false,
			message: 'Insufficient data for recommendations',
			timestamp: new Date().toISOString()
		};
		res.status(404).json(response);
		return;
	}

	const recommendations = [];

	// Temperature recommendations
	if (latestSensor.temperature > settings.temperatureThreshold.max) {
		recommendations.push({
			type: 'optimization',
			category: 'temperature',
			message: 'Consider lowering temperature threshold or improving ventilation',
			currentValue: latestSensor.temperature,
			threshold: settings.temperatureThreshold.max,
			priority: 'high'
		});
	}

	// Humidity recommendations
	if (latestSensor.humidity < settings.humidityThreshold.min) {
		recommendations.push({
			type: 'optimization',
			category: 'humidity',
			message: 'Consider increasing humidity or adjusting humidity threshold',
			currentValue: latestSensor.humidity,
			threshold: settings.humidityThreshold.min,
			priority: 'medium'
		});
	}

	// Soil moisture recommendations
	if (latestSensor.soilMoisture < settings.soilMoistureThreshold.min) {
		recommendations.push({
			type: 'action',
			category: 'irrigation',
			message: 'Soil moisture is low, consider watering or enabling auto-pump',
			currentValue: latestSensor.soilMoisture,
			threshold: settings.soilMoistureThreshold.min,
			priority: 'high'
		});
	}

	// Water level recommendations
	if (latestSensor.waterLevel < settings.waterLevelThreshold.min) {
		recommendations.push({
			type: 'alert',
			category: 'water',
			message: 'Water level is critically low, refill water tank immediately',
			currentValue: latestSensor.waterLevel,
			threshold: settings.waterLevelThreshold.min,
			priority: 'critical'
		});
	}

	// Auto control recommendations
	if (!settings.autoControl.pump && latestSensor.soilMoisture < settings.soilMoistureThreshold.min) {
		recommendations.push({
			type: 'setting',
			category: 'automation',
			message: 'Enable auto-pump control to maintain soil moisture automatically',
			priority: 'medium'
		});
	}

	const response: APIResponse = {
		success: true,
		message: 'Recommendations generated successfully',
		data: {
			recommendations,
			totalRecommendations: recommendations.length,
			critical: recommendations.filter(r => r.priority === 'critical').length,
			high: recommendations.filter(r => r.priority === 'high').length,
			medium: recommendations.filter(r => r.priority === 'medium').length
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// POST /api/settings/email-recipients - Cập nhật danh sách email nhận cảnh báo
router.post('/email-recipients', asyncHandler(async (req: Request, res: Response) => {
	const { emailRecipients } = req.body;

	if (!Array.isArray(emailRecipients)) {
		throw new AppError('Email recipients must be an array', 400);
	}

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const invalidEmails = emailRecipients.filter(email => typeof email !== 'string' || !emailRegex.test(email));

	if (invalidEmails.length > 0) {
		throw new AppError(`Invalid email format: ${invalidEmails.join(', ')}`, 400);
	}

	// Update settings
	const settings = await Settings.findOneAndUpdate(
		{},
		{
			$set: {
				'notifications.emailRecipients': emailRecipients,
				'notifications.email': emailRecipients.length > 0
			}
		},
		{ upsert: true, new: true, runValidators: true }
	);

	const response: APIResponse = {
		success: true,
		message: 'Email recipients updated successfully',
		data: {
			emailRecipients: settings.notifications.emailRecipients,
			emailEnabled: settings.notifications.email
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// POST /api/settings/test-email - Test gửi email
router.post('/test-email', asyncHandler(async (req: Request, res: Response) => {
	const { email } = req.body;

	if (!email || typeof email !== 'string') {
		throw new AppError('Email address is required', 400);
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new AppError('Invalid email format', 400);
	}

	// Import notification service
	const { notificationService } = await import('../services');

	const success = await notificationService.testEmailConfiguration(email);

	const response: APIResponse = {
		success,
		message: success ? 'Test email sent successfully' : 'Failed to send test email',
		data: { email, tested: true },
		timestamp: new Date().toISOString()
	};

	if (!success) {
		res.status(500).json(response);
		return;
	}

	res.json(response);
}));

export default router;
