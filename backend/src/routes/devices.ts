import { Router, Request, Response } from 'express';
import { DeviceStatus } from '../models';
import { validateBody, validateQuery, asyncHandler, AppError } from '../middleware';
import { DeviceControlSchema, QueryParamsSchema } from '../schemas';
import { mqttService } from '../services';
import { APIResponse, DeviceControl } from '../types';

const router = Router();

// GET /api/devices - Lấy trạng thái thiết bị
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { deviceType } = req.query as any;

	const query: any = {};
	if (deviceType) {
		query.deviceType = deviceType;
	}

	const devices = await DeviceStatus.find(query)
		.sort({ updatedAt: -1 })
		.lean();

	const response: APIResponse = {
		success: true,
		message: 'Device status retrieved successfully',
		data: devices,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/devices/:deviceType - Lấy trạng thái thiết bị theo loại
router.get('/:deviceType', asyncHandler(async (req: Request, res: Response) => {
	const { deviceType } = req.params;

	if (!['light', 'pump', 'door', 'window'].includes(deviceType)) {
		throw new AppError('Invalid device type', 400);
	}

	const device = await DeviceStatus.findOne({ deviceType })
		.sort({ updatedAt: -1 })
		.lean();

	if (!device) {
		throw new AppError('Device not found', 404);
	}

	const response: APIResponse = {
		success: true,
		message: `${deviceType} status retrieved successfully`,
		data: device,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

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

	// Create command payload
	const command = {
		action,
		timestamp: new Date().toISOString(),
		...(duration && { duration })
	};

	try {
		// Send MQTT command
		await mqttService.publishDeviceControl(deviceType, JSON.stringify(command));

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

// GET /api/devices/status - Lấy tổng quan trạng thái tất cả thiết bị
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
	const devices = await DeviceStatus.find().lean();

	const devicesSummary = {
		total: devices.length,
		online: devices.filter(d => d.status).length,
		offline: devices.filter(d => !d.status).length,
		devices: devices.reduce((acc: any, device) => {
			acc[device.deviceType] = {
				status: device.status,
				updatedAt: device.updatedAt,
				isResponding: device.updatedAt ? (Date.now() - new Date(device.updatedAt).getTime()) < 300000 : false // 5 minutes
			};
			return acc;
		}, {})
	};

	const response: APIResponse = {
		success: true,
		message: 'Device status overview retrieved successfully',
		data: devicesSummary,
		timestamp: new Date().toISOString()
	};

	res.json(response);
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
			const command = {
				action,
				timestamp: new Date().toISOString(),
				scheduled: true,
				...(duration && { duration })
			};

			await mqttService.publishDeviceControl(deviceType, JSON.stringify(command));

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

// GET /api/devices/history - Lấy lịch sử hoạt động thiết bị
router.get('/history', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 20, deviceType } = req.query as any;

	const query: any = {};
	if (deviceType) {
		query.deviceType = deviceType;
	}

	const skip = (page - 1) * limit;

	const [history, total] = await Promise.all([
		DeviceStatus.find(query)
			.sort({ updatedAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		DeviceStatus.countDocuments(query)
	]);

	const response: APIResponse = {
		success: true,
		message: 'Device history retrieved successfully',
		data: {
			history,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrev: page > 1
			}
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

export default router;
