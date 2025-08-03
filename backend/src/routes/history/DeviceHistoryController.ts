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
		const {
			page = 1,
			limit = 50,
			dateFrom,
			dateTo,
			from,
			to,
			deviceType,
			action,
			sortBy = 'timestamp',
			sortOrder = 'desc'
		} = req.query as any;

		// Validate sortBy parameter
		const validSortFields = ['timestamp', 'deviceType', 'action', 'status', 'createdAt'];
		const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'timestamp';

		const query: any = {};

		// Handle date filters - support both from/to and dateFrom/dateTo
		const fromDate = dateFrom || from;
		const toDate = dateTo || to;

		if (fromDate || toDate) {
			query.timestamp = {};
			if (fromDate) query.timestamp.$gte = new Date(fromDate);
			if (toDate) query.timestamp.$lte = new Date(toDate);
		}

		// Add device type filter
		if (deviceType && deviceType.trim()) {
			query.deviceType = deviceType;
		}

		// Add action filter
		if (action && action.trim()) {
			query.action = action;
		}

		const skip = (page - 1) * limit;

		// Build sort object
		const sortObj: any = {};
		sortObj[actualSortBy] = sortOrder === 'asc' ? 1 : -1;

		const deviceControls = await DeviceHistory.find(query)
			.sort(sortObj)
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
