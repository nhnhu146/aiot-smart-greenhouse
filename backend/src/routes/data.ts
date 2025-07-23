import { Router, Request, Response } from 'express';
import { DataMergerService } from '../services/DataMergerService';
import { cleanupDuplicateAlerts } from '../utils/alertCleanup';

const router = Router();

/**
 * GET /api/data/merge-status
 * Get data merge statistics
 */
router.get('/merge-status', async (req: Request, res: Response) => {
	try {
		const mergerService = DataMergerService.getInstance();

		// This could be extended to show merge history/stats
		res.json({
			status: 'success',
			message: 'Data merger service is running',
			service: 'active',
			periodicMerge: 'enabled (every 30 minutes)'
		});
	} catch (error) {
		console.error('❌ Error getting merge status:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to get merge status',
			error: process.env.NODE_ENV === 'development' ? error : undefined
		});
	}
});

/**
 * POST /api/data/merge
 * Manually trigger data merge for duplicate timestamps
 */
router.post('/merge', async (req: Request, res: Response) => {
	try {
		console.log('🔄 Manual data merge triggered via API');

		const mergerService = DataMergerService.getInstance();
		const stats = await mergerService.mergeSameTimestampData();

		res.json({
			status: 'success',
			message: 'Data merge completed',
			statistics: stats
		});
	} catch (error) {
		console.error('❌ Error in manual data merge:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to merge data',
			error: process.env.NODE_ENV === 'development' ? error : undefined
		});
	}
});

/**
 * POST /api/data/alerts/cleanup
 * Clean up duplicate alerts
 */
router.post('/alerts/cleanup', async (req: Request, res: Response) => {
	try {
		console.log('🔄 Alert cleanup triggered via API');

		const stats = await cleanupDuplicateAlerts();

		res.json({
			status: 'success',
			message: 'Alert cleanup completed',
			statistics: stats
		});
	} catch (error) {
		console.error('❌ Error in alert cleanup:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to cleanup alerts',
			error: process.env.NODE_ENV === 'development' ? error : undefined
		});
	}
});

export default router;
