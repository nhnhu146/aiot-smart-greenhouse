import { Router } from 'express';
import { validateQuery, asyncHandler } from '../middleware';
import { QueryParamsSchema } from '../schemas';
import { HistoryController } from './history/HistoryController';
import { SensorHistoryController } from './history/SensorHistoryController';
import { DeviceHistoryController } from './history/DeviceHistoryController';
import { ExportController } from './history/ExportController';
const router = Router();
// Initialize controllers
const historyController = new HistoryController();
const sensorHistoryController = new SensorHistoryController();
const deviceHistoryController = new DeviceHistoryController();
const exportController = new ExportController();
// General history routes
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(historyController.getGeneralHistory.bind(historyController)));
// Sensor history routes
router.get('/sensors', validateQuery(QueryParamsSchema), asyncHandler(sensorHistoryController.getSensorHistory.bind(sensorHistoryController)));
router.get('/summary', validateQuery(QueryParamsSchema), asyncHandler(sensorHistoryController.getSensorSummary.bind(sensorHistoryController)));
router.get('/trends', validateQuery(QueryParamsSchema), asyncHandler(sensorHistoryController.getSensorTrends.bind(sensorHistoryController)));
// Device history routes
router.get('/devices', validateQuery(QueryParamsSchema), asyncHandler(deviceHistoryController.getDeviceHistory.bind(deviceHistoryController)));
router.get('/device-controls', validateQuery(QueryParamsSchema), asyncHandler(deviceHistoryController.getDeviceControlHistory.bind(deviceHistoryController)));
router.get('/device-controls/count', validateQuery(QueryParamsSchema), asyncHandler(deviceHistoryController.getDeviceControlCount.bind(deviceHistoryController)));
// Export routes
router.get('/export', validateQuery(QueryParamsSchema), asyncHandler(exportController.exportAllData.bind(exportController)));
router.get('/export/device-controls', validateQuery(QueryParamsSchema), asyncHandler(exportController.exportDeviceControls.bind(exportController)));
router.get('/export/voice-commands', validateQuery(QueryParamsSchema), asyncHandler(exportController.exportVoiceCommands.bind(exportController)));
export default router;