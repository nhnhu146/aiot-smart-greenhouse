import { Request, Response } from 'express';
import { Alert } from '../../../models';
import { APIResponse } from '../../../types';
import { AlertQuerySchema } from '../AlertValidation';

export class AlertQueryController {
	/**
	 * Get alerts with pagination and filtering
	 */
	static async getAlerts(req: Request, res: Response) {
		const { page = 1, limit = 20, from, to, resolved } = AlertQuerySchema.parse(req.query);

		const query: any = {};

		// Filter by date range if provided
		if (from || to) {
			query.timestamp = {};
			if (from) query.timestamp.$gte = from;
			if (to) query.timestamp.$lte = to;
		}

		// Filter by resolved status if provided
		if (resolved !== undefined) {
			query.resolved = resolved;
		}

		const skip = (page - 1) * limit;

		const [alerts, total] = await Promise.all([
			Alert.find(query)
				.sort({ timestamp: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Alert.countDocuments(query)
		]);

		const response: APIResponse = {
			success: true,
			message: 'Alerts retrieved successfully',
			data: {
				alerts,
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

	/**
	 * Get active (unresolved) alerts
	 */
	static async getActiveAlerts(req: Request, res: Response) {
		const { page = 1, limit = 20 } = AlertQuerySchema.parse(req.query);

		const skip = (page - 1) * limit;

		const [alerts, total] = await Promise.all([
			Alert.find({ resolved: false })
				.sort({ timestamp: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Alert.countDocuments({ resolved: false })
		]);

		const response: APIResponse = {
			success: true,
			message: 'Active alerts retrieved successfully',
			data: {
				alerts,
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
}
