import { Router, Request, Response } from 'express';
import { DeviceStatus, DeviceHistory } from '../../models';
import { validateBody, asyncHandler, AppError } from '../../middleware';
import { DeviceControlSchema } from '../../schemas';
import { mqttService, deviceStateService } from '../../services';
import { APIResponse, DeviceControl } from '../../types';

const router = Router();

// POST /api/devices/control - Điều khiển thiết bị
router.post('/control', validateBody(DeviceControlSchema), asyncHandler(async (req: Request, res: Response) => {
	const { deviceType, action, duration }: DeviceControl = req.body;

	// Validate action for specific device types
	if (['door', 'window'].includes(deviceType) && !['open', 'close'].includes(action)) {
		throw new AppError(`Invalid action for ${deviceType}. Use "open" or "close"`, 400);
	}

	if (['light', 'pump'].includes(deviceType) && !['on', 'off'].includes(action)) {
		throw new AppError(`Invalid action for ${deviceType}. Use "on" or "off"`, 400);
	}

	const generatedControlId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	try {
		// Convert action to MQTT format that ESP32 understands (0/1 values)
		let mqttCommand = '0'; // Default to OFF/CLOSE
		if (action === 'on' || action === 'open') {
			mqttCommand = '1'; // ON/OPEN
		}

		// Send simple MQTT command (0/1 values)
		await mqttService.publishDeviceControl(deviceType, mqttCommand);

		// Update device state using DeviceStateService
		const status = (action === 'on' || action === 'open');
		await deviceStateService.updateDeviceState(deviceType, status, action);

		// Record device control history
		const deviceHistory = new DeviceHistory({
			deviceId: `greenhouse_${deviceType}`,
			deviceType,
			action,
			status,
			controlType: 'manual',
			userId: 'api-user',
			timestamp: new Date(),
			success: true
		});

		await deviceHistory.save();

		const response: APIResponse = {
			success: true,
			message: `${deviceType} ${action} command sent successfully`,
			data: {
				deviceType,
				action,
				status,
				timestamp: new Date().toISOString(),
				...(duration && { duration })
			},
			timestamp: new Date().toISOString()
		};

		res.json(response);

	} catch (error) {
		throw new AppError(`Failed to control ${deviceType}: ${error}`, 500);
	}
}));

// POST /api/devices/schedule - Lên lịch điều khiển thiết bị
router.post('/schedule', validateBody(DeviceControlSchema), asyncHandler(async (req: Request, res: Response) => {
	const { deviceType, action, duration } = req.body;
	const { delay = 0 } = req.body; // delay in seconds

	// Validate delay
	if (delay && (delay < 0 || delay > 86400)) { // max 24 hours
		throw new AppError('Invalid delay. Must be between 0 and 86400 seconds (24 hours)', 400);
	}

	// Schedule the command
	setTimeout(async () => {
		try {
			// Convert action to MQTT format that ESP32 understands (1/0 values)
			let mqttCommand = '0'; // Default to OFF/CLOSE
			if (action === 'on' || action === 'open') {
				mqttCommand = '1'; // ON/OPEN
			}

			// Send simple MQTT command (1/0 values)
			await mqttService.publishDeviceControl(deviceType, mqttCommand);

			// Update device status in database
			const status = (action === 'on' || action === 'open');
			await DeviceStatus.findOneAndUpdate(
				{ deviceType },
				{
					deviceId: `greenhouse_${deviceType}`,
					deviceType,
					status
				},
				{ upsert: true, new: true }
			);

			console.log(`⏰ Scheduled command executed: ${deviceType} ${action}`);
		} catch (error) {
			console.error(`❌ Scheduled command failed: ${error}`);
		}
	}, delay * 1000);

	const response: APIResponse = {
		success: true,
		message: `${deviceType} ${action} command scheduled successfully`,
		data: {
			deviceType,
			action,
			delay,
			scheduledTime: new Date(Date.now() + delay * 1000).toISOString(),
			...(duration && { duration })
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

export default router;
