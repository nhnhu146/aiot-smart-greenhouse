import { Router, Request, Response } from 'express';
import { DeviceStatus } from '../../models';
import { validateQuery, asyncHandler } from '../../middleware';
import { QueryParamsSchema } from '../../schemas';
import { APIResponse } from '../../types';

const router = Router();

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
