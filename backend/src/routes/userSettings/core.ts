import express, { Request, Response } from 'express';
import { UserSettings } from '../../models';

const router = express.Router();

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
