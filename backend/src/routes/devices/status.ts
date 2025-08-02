import { Router, Request, Response } from 'express';
import { DeviceStatus } from '../../models';
import { validateQuery, asyncHandler, AppError } from '../../middleware';
import { QueryParamsSchema } from '../../schemas';
import { APIResponse } from '../../types';

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

export default router;
