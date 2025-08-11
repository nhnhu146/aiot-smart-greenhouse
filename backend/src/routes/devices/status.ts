import { Router, Request, Response } from 'express';
import { DeviceStatus } from '../../models';
import { validateQuery, asyncHandler, AppError } from '../../middleware';
import { QueryParamsSchema } from '../../schemas';
import { APIResponse } from '../../types';
import { AppConstants } from '../../config/AppConfig';
import { DeviceStateController } from './DeviceStateController';
const router = Router();
// Device state management routes
router.get('/states', asyncHandler(DeviceStateController.getAllStates));
router.get('/states/:deviceType', asyncHandler(DeviceStateController.getDeviceState));
router.put('/states/:deviceType', asyncHandler(DeviceStateController.updateDeviceState));
router.post('/states/sync', asyncHandler(DeviceStateController.syncAllStates));
// GET /api/devices/status - Lấy tổng quan trạng thái tất cả thiết bị (MUST be before /:deviceType)
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
				isResponding: device.updatedAt ? (Date.now() - new Date(device.updatedAt).getTime()) < AppConstants.DEVICE_RESPONSE_TIMEOUT : false // 5 minutes
			};
			return acc;
		}, { /* TODO: Implement */ })
	};
	const response: APIResponse = {
		success: true,
		message: 'Device status overview retrieved successfully',
		data: devicesSummary,
		timestamp: new Date().toISOString()
	};
	res.json(response);
}));
// GET /api/devices - Lấy trạng thái thiết bị
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { deviceType } = req.query as any;
	const query: any = { /* TODO: Implement */ };
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
// GET /api/devices/:deviceType - Lấy trạng thái thiết bị theo loại (MUST be after /status)
router.get('/:deviceType', asyncHandler(async (req: Request, res: Response) => {
	const { deviceType } = req.params;
	if (!AppConstants.DEVICE_TYPES.includes(deviceType as any)) {
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
export default router;