import { Router, Request, Response } from 'express';
import { SensorData, DeviceStatus, Alert } from '../models';
import { asyncHandler } from '../middleware';
import { mqttService } from '../services';
import { APIResponse } from '../types';
import sensorsRouter from './sensors';
import devicesRouter from './devices';
import historyRouter from './history';
import settingsRouter from './settings';
import alertsRouter from './alerts';

const router = Router();

// Mount routes
router.use('/sensors', sensorsRouter);
router.use('/devices', devicesRouter);
router.use('/history', historyRouter);
router.use('/settings', settingsRouter);
router.use('/alerts', alertsRouter);

// Health check endpoint
router.get('/health', (req, res) => {
	res.json({
		success: true,
		message: 'API is healthy',
		timestamp: new Date().toISOString(),
		version: '1.0.0'
	});
});

// GET /api/dashboard - Lấy dữ liệu tổng quan cho dashboard
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
	const now = new Date();
	const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	// Get latest sensor data
	const latestSensor = await SensorData.findOne().sort({ createdAt: -1 }).lean();

	// Get device status
	const devices = await DeviceStatus.find().lean();

	// Get active alerts
	const activeAlerts = await Alert.find({ resolved: false }).sort({ timestamp: -1 }).lean();

	// Get 24h statistics
	const stats24h = await SensorData.aggregate([
		{ $match: { createdAt: { $gte: last24h } } },
		{
			$group: {
				_id: null,
				avgTemperature: { $avg: '$temperature' },
				minTemperature: { $min: '$temperature' },
				maxTemperature: { $max: '$temperature' },
				avgHumidity: { $avg: '$humidity' },
				minHumidity: { $min: '$humidity' },
				maxHumidity: { $max: '$humidity' },
				avgSoilMoisture: { $avg: '$soilMoisture' },
				minSoilMoisture: { $min: '$soilMoisture' },
				maxSoilMoisture: { $max: '$soilMoisture' },
				totalReadings: { $sum: 1 }
			}
		}
	]);

	// Get 7 days trend
	const trend7d = await SensorData.aggregate([
		{ $match: { createdAt: { $gte: last7d } } },
		{
			$group: {
				_id: {
					year: { $year: '$createdAt' },
					month: { $month: '$createdAt' },
					day: { $dayOfMonth: '$createdAt' }
				},
				avgTemperature: { $avg: '$temperature' },
				avgHumidity: { $avg: '$humidity' },
				avgSoilMoisture: { $avg: '$soilMoisture' },
				date: { $first: '$createdAt' }
			}
		},
		{ $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
	]);

	// System health check
	const systemHealth = {
		database: 'healthy',
		mqtt: mqttService.isConnected() ? 'healthy' : 'disconnected',
		sensors: latestSensor && latestSensor.createdAt && (now.getTime() - new Date(latestSensor.createdAt).getTime()) < 300000 ? 'healthy' : 'stale',
		devices: {
			total: devices.length,
			online: devices.filter(d => d.status).length,
			offline: devices.filter(d => !d.status).length
		}
	};

	const response: APIResponse = {
		success: true,
		message: 'Dashboard data retrieved successfully',
		data: {
			current: latestSensor,
			devices: devices.reduce((acc: any, device) => {
				acc[device.deviceType] = {
					status: device.status,
					updatedAt: device.updatedAt
				};
				return acc;
			}, {}),
			alerts: {
				active: activeAlerts,
				count: activeAlerts.length
			},
			statistics: {
				last24h: stats24h[0] || {},
				trend7d: trend7d
			},
			systemHealth
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

export default router;
