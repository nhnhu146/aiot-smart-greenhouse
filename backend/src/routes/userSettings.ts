import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { UserSettings } from '../models';
import { authenticateToken } from '../middleware';

const router = express.Router();

// Rate limiting for user settings
const settingsLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // limit each IP to 20 requests per windowMs
	message: {
		success: false,
		message: 'Too many settings requests from this IP, please try again later'
	}
});

router.use(settingsLimiter);
router.use(authenticateToken);

// GET /api/user-settings - Get current user settings
router.get('/', async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = (req as any).user?.id;
		const userEmail = (req as any).user?.email;

		if (!userId) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		let settings = await UserSettings.findOne({ userId });

		// Create default settings if not exists
		if (!settings) {
			settings = await UserSettings.create({
				userId,
				email: userEmail,
				alertRecipients: [userEmail]
			});
		}

		res.json({
			success: true,
			data: settings
		});
	} catch (error) {
		console.error('Error fetching user settings:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

// PUT /api/user-settings/alert-recipients - Update alert recipients
router.put('/alert-recipients', async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = (req as any).user?.id;
		const userEmail = (req as any).user?.email;
		const { recipients } = req.body;

		if (!userId) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		if (!Array.isArray(recipients)) {
			res.status(400).json({
				success: false,
				message: 'Recipients must be an array of email addresses'
			});
			return;
		}

		// Validate all email addresses
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const invalidEmails = recipients.filter(email => !emailRegex.test(email));

		if (invalidEmails.length > 0) {
			res.status(400).json({
				success: false,
				message: `Invalid email addresses: ${invalidEmails.join(', ')}`
			});
			return;
		}

		let settings = await UserSettings.findOne({ userId });
		if (!settings) {
			settings = await UserSettings.create({
				userId,
				email: userEmail,
				alertRecipients: [userEmail]
			});
		}

		// Always include user's own email
		const uniqueRecipients = Array.from(new Set([userEmail, ...recipients]));
		settings.alertRecipients = uniqueRecipients;
		await settings.save();

		res.json({
			success: true,
			message: 'Alert recipients updated successfully',
			data: { alertRecipients: settings.alertRecipients }
		});
	} catch (error) {
		console.error('Error updating alert recipients:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

// PUT /api/user-settings/mqtt-config - Update MQTT configuration
router.put('/mqtt-config', async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = (req as any).user?.id;
		const userEmail = (req as any).user?.email;
		const { host, port, username, password, clientId } = req.body;

		if (!userId) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		// Basic validation
		if (host && typeof host !== 'string') {
			res.status(400).json({
				success: false,
				message: 'MQTT host must be a string'
			});
			return;
		}

		if (port && (typeof port !== 'number' || port < 1 || port > 65535)) {
			res.status(400).json({
				success: false,
				message: 'MQTT port must be a number between 1 and 65535'
			});
			return;
		}

		let settings = await UserSettings.findOne({ userId });
		if (!settings) {
			settings = await UserSettings.create({
				userId,
				email: userEmail,
				alertRecipients: [userEmail]
			});
		}

		// Update MQTT config
		const mqttConfig: any = { ...settings.mqttConfig };
		if (host !== undefined) mqttConfig.host = host;
		if (port !== undefined) mqttConfig.port = port;
		if (username !== undefined) mqttConfig.username = username;
		if (password !== undefined) mqttConfig.password = password;
		if (clientId !== undefined) mqttConfig.clientId = clientId;

		settings.mqttConfig = mqttConfig;
		await settings.save();

		res.json({
			success: true,
			message: 'MQTT configuration updated successfully',
			data: { mqttConfig: settings.mqttConfig }
		});
	} catch (error) {
		console.error('Error updating MQTT config:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

// PUT /api/user-settings/alert-thresholds - Update alert thresholds
router.put('/alert-thresholds', async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = (req as any).user?.id;
		const userEmail = (req as any).user?.email;
		const { temperature, humidity, soilMoisture, lightLevel } = req.body;

		if (!userId) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		let settings = await UserSettings.findOne({ userId });
		if (!settings) {
			settings = await UserSettings.create({
				userId,
				email: userEmail,
				alertRecipients: [userEmail]
			});
		}

		// Update alert thresholds
		const thresholds: any = { ...settings.alertThresholds };
		if (temperature) thresholds.temperature = temperature;
		if (humidity) thresholds.humidity = humidity;
		if (soilMoisture) thresholds.soilMoisture = soilMoisture;
		if (lightLevel) thresholds.lightLevel = lightLevel;

		settings.alertThresholds = thresholds;
		await settings.save();

		res.json({
			success: true,
			message: 'Alert thresholds updated successfully',
			data: { alertThresholds: settings.alertThresholds }
		});
	} catch (error) {
		console.error('Error updating alert thresholds:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

// POST /api/user-settings/reset - Reset to default settings
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = (req as any).user?.id;
		const userEmail = (req as any).user?.email;

		if (!userId) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		// Delete existing settings and create new defaults
		await UserSettings.deleteOne({ userId });
		const settings = await UserSettings.create({
			userId,
			email: userEmail,
			alertRecipients: [userEmail]
		});

		res.json({
			success: true,
			message: 'Settings reset to defaults successfully',
			data: settings
		});
	} catch (error) {
		console.error('Error resetting settings:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

export default router;
