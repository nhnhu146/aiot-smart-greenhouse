import { Router, Request, Response } from 'express';
import { SensorData, DeviceStatus, DeviceHistory, Alert, VoiceCommand } from '../models';
import { validateQuery, asyncHandler, AppError } from '../middleware';
import { QueryParamsSchema } from '../schemas';
import { APIResponse } from '../types';
import { formatVietnamTimestamp } from '../utils/timezone';
import { DataMergerService } from '../services/DataMergerService';
import { countService } from '../services';

const router = Router();

// GET /api/history - Lấy dữ liệu lịch sử
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 50, from, to } = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.createdAt = {};
		if (from) query.createdAt.$gte = from;
		if (to) query.createdAt.$lte = to;
	}

	const skip = (page - 1) * limit;

	// Smart merge: only merge if duplicates detected
	const mergerService = DataMergerService.getInstance();
	try {
		// Quick duplicate check first
		const quickDuplicateCheck = await SensorData.aggregate([
			{ $match: query },
			{
				$group: {
					_id: '$createdAt',
					count: { $sum: 1 }
				}
			},
			{ $match: { count: { $gt: 1 } } },
			{ $limit: 1 }
		]);

		if (quickDuplicateCheck.length > 0) {
			await mergerService.mergeSameTimestampData();
			console.log('✅ Data merged before history fetch (duplicates found)');
		} else {
			console.log('✅ No duplicates detected, skipping merge');
		}
	} catch (mergeError) {
		console.warn('⚠️ Merge failed, continuing with raw data:', mergeError);
	}

	// Get sensor data history
	const [sensorHistory, deviceHistory, deviceControlHistory, alertHistory] = await Promise.all([
		SensorData.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		DeviceStatus.find()
			.sort({ updatedAt: -1 })
			.lean(),
		DeviceHistory.find(query.createdAt ? { timestamp: query.createdAt } : {})
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Alert.find(query.createdAt ? { createdAt: query.createdAt } : {})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean()
	]);

	const totalSensors = await SensorData.countDocuments(query);
	const totalDeviceControls = await DeviceHistory.countDocuments(query.createdAt ? { timestamp: query.createdAt } : {});
	const totalAlerts = await Alert.countDocuments(query.createdAt ? { createdAt: query.createdAt } : {});

	const response: APIResponse = {
		success: true,
		message: 'History data retrieved successfully',
		data: {
			sensors: {
				data: sensorHistory,
				pagination: {
					page,
					limit,
					total: totalSensors,
					totalPages: Math.ceil(totalSensors / limit),
					hasNext: page < Math.ceil(totalSensors / limit),
					hasPrev: page > 1
				}
			},
			devices: deviceHistory,
			deviceControls: {
				data: deviceControlHistory,
				pagination: {
					page,
					limit,
					total: totalDeviceControls,
					totalPages: Math.ceil(totalDeviceControls / limit),
					hasNext: page < Math.ceil(totalDeviceControls / limit),
					hasPrev: page > 1
				}
			},
			alerts: {
				data: alertHistory,
				pagination: {
					page,
					limit,
					total: totalAlerts,
					totalPages: Math.ceil(totalAlerts / limit),
					hasNext: page < Math.ceil(totalAlerts / limit),
					hasPrev: page > 1
				}
			}
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/history/sensors - Lấy lịch sử cảm biến (chỉ 24h gần nhất)
router.get('/sensors', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 100, from, to } = req.query as any;

	const query: any = {};

	// Default to last 24 hours if no date range specified
	if (!from && !to) {
		const last24Hours = new Date();
		last24Hours.setHours(last24Hours.getHours() - 24);
		query.createdAt = { $gte: last24Hours };
	} else if (from || to) {
		query.createdAt = {};
		if (from) query.createdAt.$gte = from;
		if (to) query.createdAt.$lte = to;
	}

	const skip = (page - 1) * limit;

	// Smart merge for sensors: only if duplicates exist
	const mergerService = DataMergerService.getInstance();
	try {
		// Quick duplicate check first
		const quickDuplicateCheck = await SensorData.aggregate([
			{ $match: query },
			{
				$group: {
					_id: '$createdAt',
					count: { $sum: 1 }
				}
			},
			{ $match: { count: { $gt: 1 } } },
			{ $limit: 1 }
		]);

		if (quickDuplicateCheck.length > 0) {
			await mergerService.mergeSameTimestampData();
			console.log('✅ Sensor data merged before fetch (duplicates found)');
		} else {
			console.log('✅ No sensor duplicates detected, skipping merge');
		}
	} catch (mergeError) {
		console.warn('⚠️ Sensor merge failed, continuing with raw data:', mergeError);
	}

	const [data, total] = await Promise.all([
		SensorData.find(query)
			.sort({ createdAt: -1 }) // Sort by newest first
			.skip(skip)
			.limit(limit)
			.lean(),
		SensorData.countDocuments(query)
	]);

	const response: APIResponse = {
		success: true,
		message: 'Sensor history retrieved successfully (last 24 hours)',
		data: {
			sensors: data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrev: page > 1
			},
			timeRange: !from && !to ? 'last24Hours' : 'custom'
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/history/devices - Lấy lịch sử thiết bị
router.get('/devices', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { deviceType } = req.query as any;

	const query: any = {};
	if (deviceType) {
		query.deviceType = deviceType;
	}

	const devices = await DeviceStatus.find(query)
		.sort({ updatedAt: -1 })
		.lean();

	const response: APIResponse = {
		success: true,
		message: 'Device history retrieved successfully',
		data: devices,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/history/summary - Lấy tóm tắt lịch sử theo ngày
router.get('/summary', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to } = req.query as any;

	const matchQuery: any = {};
	if (from || to) {
		matchQuery.createdAt = {};
		if (from) matchQuery.createdAt.$gte = from;
		if (to) matchQuery.createdAt.$lte = to;
	}

	const dailySummary = await SensorData.aggregate([
		{ $match: matchQuery },
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
				avgWaterLevel: { $avg: '$waterLevel' },
				avgPlantHeight: { $avg: '$plantHeight' },
				rainCount: { $sum: { $cond: ['$rainStatus', 1, 0] } },
				totalReadings: { $sum: 1 },
				date: { $first: '$createdAt' }
			}
		},
		{ $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
		{ $limit: 30 } // Last 30 days
	]);

	const response: APIResponse = {
		success: true,
		message: 'History summary retrieved successfully',
		data: dailySummary,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/history/trends - Phân tích xu hướng dữ liệu
router.get('/trends', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to } = req.query as any;

	const matchQuery: any = {};
	if (from || to) {
		matchQuery.createdAt = {};
		if (from) matchQuery.createdAt.$gte = from;
		if (to) matchQuery.createdAt.$lte = to;
	}

	const trends = await SensorData.aggregate([
		{ $match: matchQuery },
		{
			$group: {
				_id: {
					year: { $year: '$createdAt' },
					month: { $month: '$createdAt' },
					day: { $dayOfMonth: '$createdAt' },
					hour: { $hour: '$createdAt' }
				},
				avgTemperature: { $avg: '$temperature' },
				avgHumidity: { $avg: '$humidity' },
				avgSoilMoisture: { $avg: '$soilMoisture' },
				avgWaterLevel: { $avg: '$waterLevel' },
				avgPlantHeight: { $avg: '$plantHeight' },
				count: { $sum: 1 }
			}
		},
		{ $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
		{ $limit: 168 } // Last 7 days (24 hours * 7)
	]);

	const response: APIResponse = {
		success: true,
		message: 'Data trends retrieved successfully',
		data: trends,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/history/export - Export toàn bộ dữ liệu lịch sử
router.get('/export', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to, format = 'json' } = req.query as any;

	const query: any = {};
	if (from || to) {
		query.timestamp = {};
		if (from) query.timestamp.$gte = from;
		if (to) query.timestamp.$lte = to;
	}

	const [sensors, devices, alerts] = await Promise.all([
		SensorData.find(query).sort({ createdAt: -1 }).limit(5000).lean(),
		DeviceStatus.find().sort({ updatedAt: -1 }).lean(),
		Alert.find(query.timestamp ? { timestamp: query.timestamp } : {})
			.sort({ timestamp: -1 }).limit(1000).lean()
	]);

	const exportData = {
		exportTime: formatVietnamTimestamp(),
		dateRange: { from, to },
		data: {
			sensors: sensors,
			devices: devices,
			alerts: alerts
		},
		summary: {
			totalSensorReadings: sensors.length,
			totalDevices: devices.length,
			totalAlerts: alerts.length
		}
	};

	if (format === 'csv') {
		// CSV export for sensors only
		const csvHeader = 'Timestamp,Temperature,Humidity,SoilMoisture,WaterLevel,PlantHeight,RainStatus\n';
		const csvData = sensors.map((row: any) =>
			`${row.timestamp},${row.temperature},${row.humidity},${row.soilMoisture},${row.waterLevel},${row.plantHeight},${row.rainStatus}`
		).join('\n');

		const csvContent = csvHeader + csvData;

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', `attachment; filename=history-export-${Date.now()}.csv`);
		res.send(csvContent);
	} else {
		// JSON export
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', `attachment; filename=history-export-${Date.now()}.json`);
		res.json(exportData);
	}
}));

// GET /api/history/compare - So sánh dữ liệu giữa các khoảng thời gian
router.get('/compare', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { period1_from, period1_to, period2_from, period2_to } = req.query as any;

	if (!period1_from || !period1_to || !period2_from || !period2_to) {
		throw new AppError('Missing required parameters: period1_from, period1_to, period2_from, period2_to', 400);
	}

	const [period1Data, period2Data] = await Promise.all([
		SensorData.aggregate([
			{ $match: { timestamp: { $gte: new Date(period1_from), $lte: new Date(period1_to) } } },
			{
				$group: {
					_id: null,
					avgTemperature: { $avg: '$temperature' },
					avgHumidity: { $avg: '$humidity' },
					avgSoilMoisture: { $avg: '$soilMoisture' },
					avgWaterLevel: { $avg: '$waterLevel' },
					avgPlantHeight: { $avg: '$plantHeight' },
					count: { $sum: 1 }
				}
			}
		]),
		SensorData.aggregate([
			{ $match: { timestamp: { $gte: new Date(period2_from), $lte: new Date(period2_to) } } },
			{
				$group: {
					_id: null,
					avgTemperature: { $avg: '$temperature' },
					avgHumidity: { $avg: '$humidity' },
					avgSoilMoisture: { $avg: '$soilMoisture' },
					avgWaterLevel: { $avg: '$waterLevel' },
					avgPlantHeight: { $avg: '$plantHeight' },
					count: { $sum: 1 }
				}
			}
		])
	]);

	const period1 = period1Data[0] || {};
	const period2 = period2Data[0] || {};

	// Calculate differences
	const comparison = {
		temperature: {
			period1: period1.avgTemperature || 0,
			period2: period2.avgTemperature || 0,
			difference: (period2.avgTemperature || 0) - (period1.avgTemperature || 0),
			percentChange: period1.avgTemperature ?
				(((period2.avgTemperature || 0) - period1.avgTemperature) / period1.avgTemperature * 100) : 0
		},
		humidity: {
			period1: period1.avgHumidity || 0,
			period2: period2.avgHumidity || 0,
			difference: (period2.avgHumidity || 0) - (period1.avgHumidity || 0),
			percentChange: period1.avgHumidity ?
				(((period2.avgHumidity || 0) - period1.avgHumidity) / period1.avgHumidity * 100) : 0
		},
		soilMoisture: {
			period1: period1.avgSoilMoisture || 0,
			period2: period2.avgSoilMoisture || 0,
			difference: (period2.avgSoilMoisture || 0) - (period1.avgSoilMoisture || 0),
			percentChange: period1.avgSoilMoisture ?
				(((period2.avgSoilMoisture || 0) - period1.avgSoilMoisture) / period1.avgSoilMoisture * 100) : 0
		},
		waterLevel: {
			period1: period1.avgWaterLevel || 0,
			period2: period2.avgWaterLevel || 0,
			difference: (period2.avgWaterLevel || 0) - (period1.avgWaterLevel || 0),
			percentChange: period1.avgWaterLevel ?
				(((period2.avgWaterLevel || 0) - period1.avgWaterLevel) / period1.avgWaterLevel * 100) : 0
		},
		plantHeight: {
			period1: period1.avgPlantHeight || 0,
			period2: period2.avgPlantHeight || 0,
			difference: (period2.avgPlantHeight || 0) - (period1.avgPlantHeight || 0),
			percentChange: period1.avgPlantHeight ?
				(((period2.avgPlantHeight || 0) - period1.avgPlantHeight) / period1.avgPlantHeight * 100) : 0
		}
	};

	const response: APIResponse = {
		success: true,
		message: 'Data comparison retrieved successfully',
		data: {
			periods: {
				period1: { from: period1_from, to: period1_to, readings: period1.count || 0 },
				period2: { from: period2_from, to: period2_to, readings: period2.count || 0 }
			},
			comparison
		},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/history/device-controls - Lấy lịch sử điều khiển thiết bị (auto/manual)
router.get('/device-controls', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 50, from, to, deviceType, controlType } = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.timestamp = {};
		if (from) query.timestamp.$gte = from;
		if (to) query.timestamp.$lte = to;
	}

	// Filter by device type if provided
	if (deviceType && ['light', 'pump', 'door', 'window'].includes(deviceType)) {
		query.deviceType = deviceType;
	}

	// Filter by control type if provided
	if (controlType && ['auto', 'manual'].includes(controlType)) {
		query.controlType = controlType;
	}

	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		DeviceHistory.find(query)
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		DeviceHistory.countDocuments(query)
	]);

	const response: APIResponse = {
		success: true,
		message: 'Device control history retrieved successfully',
		data: {
			controls: data,
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
}));

// GET /api/history/export/sensors - Export sensor data as CSV
router.get('/export/sensors', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const {
		from,
		to,
		minTemperature,
		maxTemperature,
		minHumidity,
		maxHumidity,
		minSoilMoisture,
		maxSoilMoisture,
		minWaterLevel,
		maxWaterLevel,
		soilMoisture,
		waterLevel,
		rainStatus,
		sortBy = 'createdAt',
		sortOrder = 'desc'
	} = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.createdAt = {};
		if (from) query.createdAt.$gte = new Date(from);
		if (to) query.createdAt.$lte = new Date(to);
	}

	// Value range filters
	if (minTemperature !== undefined || maxTemperature !== undefined) {
		query.temperature = {};
		if (minTemperature !== undefined) query.temperature.$gte = parseFloat(minTemperature);
		if (maxTemperature !== undefined) query.temperature.$lte = parseFloat(maxTemperature);
	}

	if (minHumidity !== undefined || maxHumidity !== undefined) {
		query.humidity = {};
		if (minHumidity !== undefined) query.humidity.$gte = parseFloat(minHumidity);
		if (maxHumidity !== undefined) query.humidity.$lte = parseFloat(maxHumidity);
	}

	if (minSoilMoisture !== undefined || maxSoilMoisture !== undefined) {
		query.soilMoisture = {};
		if (minSoilMoisture !== undefined) query.soilMoisture.$gte = parseFloat(minSoilMoisture);
		if (maxSoilMoisture !== undefined) query.soilMoisture.$lte = parseFloat(maxSoilMoisture);
	}

	if (minWaterLevel !== undefined || maxWaterLevel !== undefined) {
		query.waterLevel = {};
		if (minWaterLevel !== undefined) query.waterLevel.$gte = parseFloat(minWaterLevel);
		if (maxWaterLevel !== undefined) query.waterLevel.$lte = parseFloat(maxWaterLevel);
	}

	// Specific value filters
	if (soilMoisture !== undefined) query.soilMoisture = parseFloat(soilMoisture);
	if (waterLevel !== undefined) query.waterLevel = parseFloat(waterLevel);
	if (rainStatus !== undefined) query.rainStatus = rainStatus === 'true';

	// Sort options
	const sortOptions: any = {};
	sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

	const data = await SensorData.find(query)
		.sort(sortOptions)
		.lean();

	// Convert to CSV
	const csvHeader = 'Timestamp,Temperature,Humidity,Soil Moisture,Water Level,Rain Status,Plant Height\n';
	const csvRows = data.map((item: any) => {
		const timestamp = new Date(item.createdAt || item.timestamp).toISOString();
		return `${timestamp},${item.temperature || 0},${item.humidity || 0},${item.soilMoisture || 0},${item.waterLevel || 0},${item.rainStatus || false},${item.plantHeight || 0}`;
	}).join('\n');

	const csv = csvHeader + csvRows;

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', 'attachment; filename="sensor-data.csv"');
	res.send(csv);
}));

// GET /api/history/export/device-controls - Export device controls as CSV
router.get('/export/device-controls', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to, deviceType, controlType } = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.timestamp = {};
		if (from) query.timestamp.$gte = new Date(from);
		if (to) query.timestamp.$lte = new Date(to);
	}

	// Filter by device type
	if (deviceType) {
		query.deviceType = deviceType;
	}

	// Filter by control type (auto/manual)
	if (controlType) {
		query.controlType = controlType;
	}

	const data = await DeviceHistory.find(query)
		.sort({ timestamp: -1 })
		.lean();

	// Convert to CSV
	const csvHeader = 'Timestamp,Device ID,Device Type,Action,Status,Control Type,Triggered By,User ID,Success\n';
	const csvRows = data.map((item: any) => {
		const timestamp = new Date(item.timestamp || item.createdAt).toISOString();
		return `${timestamp},"${item.deviceId || ''}","${item.deviceType}","${item.action}",${item.status},"${item.controlType || ''}","${item.triggeredBy || ''}","${item.userId || ''}",${item.success}`;
	}).join('\n');

	const csv = csvHeader + csvRows;

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', 'attachment; filename="device-controls.csv"');
	res.send(csv);
}));

// GET /api/history/export/voice-commands - Export voice commands as CSV
router.get('/export/voice-commands', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to } = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.timestamp = {};
		if (from) query.timestamp.$gte = new Date(from);
		if (to) query.timestamp.$lte = new Date(to);
	}

	const data = await VoiceCommand.find(query)
		.sort({ timestamp: -1 })
		.lean();

	// Convert to CSV
	const csvHeader = 'Timestamp,Command,Confidence,Processed,Error Message\n';
	const csvRows = data.map((item: any) => {
		const timestamp = new Date(item.timestamp || item.createdAt).toISOString();
		return `${timestamp},"${item.command}",${item.confidence || 'N/A'},${item.processed},"${item.errorMessage || ''}"`;
	}).join('\n');

	const csv = csvHeader + csvRows;

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', 'attachment; filename="voice-commands.csv"');
	res.send(csv);
}));

// GET /api/history/device-controls/count - Get count of device controls
router.get('/device-controls/count', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to, deviceType, action } = req.query as any;

	const filters = {
		from,
		to,
		deviceType,
		action
	};

	const count = await countService.countDeviceControls(filters);

	const response: APIResponse = {
		success: true,
		message: 'Device controls count retrieved successfully',
		data: { count },
		timestamp: formatVietnamTimestamp()
	};

	res.json(response);
}));

export default router;
