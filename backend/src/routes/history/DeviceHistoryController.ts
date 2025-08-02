import { Request, Response } from 'express';
import { DeviceHistory, VoiceCommand } from '../../models';
import { APIResponse } from '../../types';
import { countService } from '../../services';

export class DeviceHistoryController {
	async getDeviceHistory(req: Request, res: Response): Promise<void> {
		const { page = 1, limit = 50, from, to } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.timestamp = {};
			if (from) query.timestamp.$gte = from;
			if (to) query.timestamp.$lte = to;
		}

		const skip = (page - 1) * limit;

		const deviceHistory = await DeviceHistory.find(query)
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		const total = await DeviceHistory.countDocuments(query);

		const response: APIResponse = {
			success: true,
			message: 'Device history retrieved successfully',
			data: {
				devices: deviceHistory,
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
	}

	async getDeviceControlHistory(req: Request, res: Response): Promise<void> {
		const { page = 1, limit = 50, from, to } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.timestamp = {};
			if (from) query.timestamp.$gte = from;
			if (to) query.timestamp.$lte = to;
		}

		const skip = (page - 1) * limit;

		const deviceControls = await DeviceHistory.find(query)
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		const total = await DeviceHistory.countDocuments(query);

		const response: APIResponse = {
			success: true,
			message: 'Device control history retrieved successfully',
			data: {
				deviceControls,
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
	}

	async getDeviceControlCount(req: Request, res: Response): Promise<void> {
		const { from, to } = req.query as any;

		try {
			const query: any = {};
			if (from || to) {
				query.timestamp = {};
				if (from) query.timestamp.$gte = from;
				if (to) query.timestamp.$lte = to;
			}

			const count = await DeviceHistory.countDocuments(query);

			const response: APIResponse = {
				success: true,
				message: 'Device control count retrieved successfully',
				data: {
					count: count,
					query: query
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error('Error getting device control count:', error);
			const response: APIResponse = {
				success: false,
				message: 'Failed to get device control count',
				error: 'Database error occurred',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	}
}
