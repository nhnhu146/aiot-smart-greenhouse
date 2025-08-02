import express, { Request, Response } from 'express';
import { UserSettings } from '../../models';

const router = express.Router();

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

export default router;
