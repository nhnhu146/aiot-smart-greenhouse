import { Request, Response } from 'express';
import { Alert } from '../../models';
import { APIResponse } from '../../types';
import { AppError } from '../../middleware';
import { AlertQuerySchema } from './AlertValidation';

export class AlertController {
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

	/**
	 * Get alert statistics
	 */
	static async getAlertStats(req: Request, res: Response) {
		const stats = await Alert.aggregate([
			{
				$group: {
					_id: null,
					total: { $sum: 1 },
					active: { $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } },
					resolved: { $sum: { $cond: [{ $eq: ['$resolved', true] }, 1, 0] } },
					warnings: { $sum: { $cond: [{ $eq: ['$type', 'warning'] }, 1, 0] } },
					errors: { $sum: { $cond: [{ $eq: ['$type', 'error'] }, 1, 0] } },
					info: { $sum: { $cond: [{ $eq: ['$type', 'info'] }, 1, 0] } }
				}
			}
		]);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const todayStats = await Alert.aggregate([
			{ $match: { timestamp: { $gte: today } } },
			{
				$group: {
					_id: null,
					todayTotal: { $sum: 1 },
					todayActive: { $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } }
				}
			}
		]);

		const response: APIResponse = {
			success: true,
			message: 'Alert statistics retrieved successfully',
			data: {
				overall: stats[0] || { total: 0, active: 0, resolved: 0, warnings: 0, errors: 0, info: 0 },
				today: todayStats[0] || { todayTotal: 0, todayActive: 0 }
			},
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	/**
	 * Create new alert
	 */
	static async createAlert(req: Request, res: Response) {
		const alertData = req.body;

		const alert = new Alert({
			...alertData,
			timestamp: new Date(),
			resolved: false
		});

		await alert.save();

		const response: APIResponse = {
			success: true,
			message: 'Alert created successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};

		res.status(201).json(response);
	}

	/**
	 * Resolve alert by ID
	 */
	static async resolveAlert(req: Request, res: Response) {
		const { id } = req.params;

		const alert = await Alert.findByIdAndUpdate(
			id,
			{ resolved: true },
			{ new: true }
		);

		if (!alert) {
			throw new AppError('Alert not found', 404);
		}

		const response: APIResponse = {
			success: true,
			message: 'Alert resolved successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	/**
	 * Mark alert as unresolved
	 */
	static async unresolveAlert(req: Request, res: Response) {
		const { id } = req.params;

		const alert = await Alert.findByIdAndUpdate(
			id,
			{ resolved: false },
			{ new: true }
		);

		if (!alert) {
			throw new AppError('Alert not found', 404);
		}

		const response: APIResponse = {
			success: true,
			message: 'Alert marked as unresolved successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	/**
	 * Delete alert by ID
	 */
	static async deleteAlert(req: Request, res: Response) {
		const { id } = req.params;

		const alert = await Alert.findByIdAndDelete(id);

		if (!alert) {
			throw new AppError('Alert not found', 404);
		}

		const response: APIResponse = {
			success: true,
			message: 'Alert deleted successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	/**
	 * Resolve all unresolved alerts
	 */
	static async resolveAllAlerts(req: Request, res: Response) {
		const result = await Alert.updateMany(
			{ resolved: false },
			{ resolved: true }
		);

		const response: APIResponse = {
			success: true,
			message: `${result.modifiedCount} alerts resolved successfully`,
			data: {
				modifiedCount: result.modifiedCount,
				matchedCount: result.matchedCount
			},
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}
}
