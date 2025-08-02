import express, { Request, Response } from 'express';
import { UserSettings } from '../../models';

const router = express.Router();

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

export default router;
