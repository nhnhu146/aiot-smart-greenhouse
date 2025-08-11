import { Router, Request, Response } from 'express';
import { DataMergerService } from '../services/DataMergerService';
import { removeDuplicateAlerts } from '../utils/alertUtils';
import { removeDuplicateData } from '../utils/dataUtils';
import { asyncHandler } from '../middleware';
import { Config } from '../config/AppConfig';
// Use DataMergerService directly
const router = Router();
/**
 * GET /api/data/merge-status
 * Get data merge statistics
 */
router.get('/merge-status', asyncHandler(async (req: Request, res: Response) => {
	try {
 DataMergerService.getInstance();
		// This could be extended to show merge history/stats
		res.json({
			success: true,
			message: 'Data merger service is running',
			service: 'active',
			periodicMerge: 'enabled (every 5 minutes)',
			mergeStrategy: 'minute-level deduplication'
		});
	} catch (error) {
		console.error('❌ Error getting merge status:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get merge status',
			error: Config.app.env === 'development' ? error : undefined
		});
	}
}));
/**
 * POST /api/data/merge
 * Manually trigger data merge for duplicate timestamps
 */
router.post('/merge', asyncHandler(async (req: Request, res: Response) => {
	try {
		console.log('🔄 Manual data merge triggered via API');
 const dataMergerService = DataMergerService.getInstance();
		const stats = await dataMergerService.mergeSameTimestampData();
		res.json({
			success: true,
			message: 'Data merge completed successfully',
			statistics: stats,
			action: 'merged_duplicates',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('❌ Error in manual data merge:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to merge data',
			error: Config.app.env === 'development' ? error : undefined
		});
	}
}));
/**
 * POST /api/data/alerts/cleanup
 * Clean up duplicate alerts
 */
router.post('/alerts/cleanup', asyncHandler(async (req: Request, res: Response) => {
	try {
		console.log('🔄 Alert cleanup triggered via API');
		const stats = await removeDuplicateAlerts();
		res.json({
			success: true,
			message: 'Alert cleanup completed',
			statistics: stats
		});
	} catch (error) {
		console.error('❌ Error in alert cleanup:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to cleanup alerts',
			error: Config.app.env === 'development' ? error : undefined
		});
	}
}));
/**
 * POST /api/data/sensor/cleanup
 * Enhanced cleanup for duplicate sensor data
 */
router.post('/sensor/cleanup', asyncHandler(async (req: Request, res: Response) => {
	try {
		console.log('🔄 Enhanced sensor data cleanup triggered via API');
		const stats = await removeDuplicateData();
		res.json({
			success: true,
			message: 'Enhanced sensor data cleanup completed',
			statistics: stats
		});
	} catch (error) {
		console.error('❌ Error in sensor data cleanup:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to cleanup sensor data',
			error: Config.app.env === 'development' ? error : undefined
		});
	}
}));
export default router;