import { Request, Response } from 'express';
import { Alert } from '../../../models';
import { APIResponse } from '../../../types';
export class AlertStatsController {
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
}
