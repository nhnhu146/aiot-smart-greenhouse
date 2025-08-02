import { Router, Request, Response } from 'express';
import { validateQuery, asyncHandler } from '../middleware';
import { QueryParamsSchema } from '../schemas';
import { SensorDataController } from './sensors/SensorDataController';
import { SensorStatsController } from './sensors/SensorStatsController';
import { SensorExportController } from './sensors/SensorExportController';
import { DataMergerService } from '../services/DataMergerService';

const router = Router();

// Initialize controllers
const dataController = new SensorDataController();
const statsController = new SensorStatsController();
const exportController = new SensorExportController();

// Main sensor data routes
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(dataController.getSensorData.bind(dataController)));
router.get('/latest', asyncHandler(dataController.getLatestSensorData.bind(dataController)));
router.get('/current', asyncHandler(dataController.getCurrentSensorStatus.bind(dataController)));

// Statistics and realtime routes
router.get('/stats', validateQuery(QueryParamsSchema), asyncHandler(statsController.getSensorStats.bind(statsController)));
router.get('/realtime', asyncHandler(statsController.getRealtimeData.bind(statsController)));

// Export and count routes
router.get('/export', validateQuery(QueryParamsSchema), asyncHandler(exportController.exportSensorData.bind(exportController)));
router.get('/count', validateQuery(QueryParamsSchema), asyncHandler(exportController.getSensorCount.bind(exportController)));

// Data merger route
router.post('/merge', asyncHandler(async (req: Request, res: Response) => {
	const mergerService = DataMergerService.getInstance();
	const stats = await mergerService.mergeSameTimestampData();

	res.json({
		success: true,
		message: 'Data merge completed',
		data: stats,
		timestamp: new Date().toISOString()
	});
}));

export default router;
