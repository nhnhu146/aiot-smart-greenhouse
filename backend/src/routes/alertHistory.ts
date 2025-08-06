import { Router, Request, Response } from 'express';
import { Alert } from '../models/Alert';
import { asyncHandler } from '../middleware';

const router = Router();
// GET /api/history/alerts - Get alert history with filters
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			dateFrom,
			dateTo,
			severity,
			type,
			acknowledged
		} = req.query;
		const filters: any = {};
		// Date range filter
		if (dateFrom || dateTo) {
			filters.createdAt = {};
			if (dateFrom) filters.createdAt.$gte = new Date(dateFrom as string);
			if (dateTo) filters.createdAt.$lte = new Date(dateTo as string);
		}

		// Severity filter
		if (severity && severity !== '') {
			filters.level = severity;
		}

		// Type filter  
		if (type && type !== '') {
			filters.type = type;
		}

		// Acknowledged filter
		if (acknowledged !== undefined && acknowledged !== '') {
			filters.acknowledged = acknowledged === 'true';
		}

		const sortOptions: any = { createdAt: -1 };
		sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
		const skip = (Number(page) - 1) * Number(limit);
		const [alerts, total] = await Promise.all([
			Alert.find(filters)
				.sort(sortOptions)
				.skip(skip)
				.limit(Number(limit))
				.lean(),
			Alert.countDocuments(filters)
		]);
		const totalPages = Math.ceil(total / Number(limit));
		res.json({
			success: true,
			data: alerts,
			pagination: {
				page: Number(page),
				limit: Number(limit),
				total,
				totalPages,
				hasNext: Number(page) < totalPages,
				hasPrev: Number(page) > 1
			}
		});
	} catch (error) {
		console.error('Error fetching alert history:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch alert history'
		});
	}
}));
// GET /api/history/alerts/export - Export alert history
router.get('/export', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			format = 'json',
			dateFrom,
			dateTo,
			severity,
			type,
			acknowledged,
			limit = 10000
		} = req.query;
		const filters: any = {};
		// Apply same filters as main endpoint
		if (dateFrom || dateTo) {
			filters.createdAt = {};
			if (dateFrom) filters.createdAt.$gte = new Date(dateFrom as string);
			if (dateTo) filters.createdAt.$lte = new Date(dateTo as string);
		}

		if (severity && severity !== '') filters.level = severity;
		if (type && type !== '') filters.type = type;
		if (acknowledged !== undefined && acknowledged !== '') {
			filters.acknowledged = acknowledged === 'true';
		}

		const alerts = await Alert.find(filters)
			.sort({ createdAt: -1 })
			.limit(Number(limit))
			.lean();
		if (format === 'csv') {
			// Generate CSV
			const csvHeader = 'Timestamp,Type,Level,Message,Value,Acknowledged\n';
			const csvRows = alerts.map(alert =>
				`'${alert.createdAt}','${alert.type}','${alert.level}','${alert.message}',"${alert.value || ''}','${alert.acknowledged || false}"`
			).join('\n');
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'attachment; filename=alert-history.csv');
			res.send(csvHeader + csvRows);
		} else {
			// JSON format with proper download headers
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=alert-history.json');
			res.send(JSON.stringify(alerts, null, 2));
		}

	} catch (error) {
		console.error('Error exporting alert history:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to export alert history'
		});
	}
}));
// PUT /api/history/alerts/:id/acknowledge - Acknowledge alert
router.put('/:id/acknowledge', asyncHandler(async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const alert = await Alert.findByIdAndUpdate(
			id,
			{
				acknowledged: true,
				acknowledgedAt: new Date()
			},
			{ new: true }
		);
		if (!alert) {
			res.status(404).json({
				success: false,
				message: 'Alert not found'
			});
			return;
		}

		res.json({
			success: true,
			message: 'Alert acknowledged successfully',
			data: alert
		});
	} catch (error) {
		console.error('Error acknowledging alert:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to acknowledge alert'
		});
	}
}));
export default router;