import { Router, Request, Response } from 'express';
import { SensorData, DeviceStatus, DeviceHistory, Alert } from '../models';
import { validateQuery, asyncHandler, AppError } from '../middleware';
import { QueryParamsSchema } from '../schemas';
import { APIResponse } from '../types';
import { formatVietnamTimestamp } from '../utils/timezone';
import { DataMergerService } from '../services/DataMergerService';

const router = Router();

// GET /api/history - Lấy dữ liệu lịch sử
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const {
		page = 1,
		limit = 50,
		from,
		to,
		// Range filters
		tempMin, tempMax,
		humidityMin, humidityMax,
		soilMin, soilMax,
		waterMin, waterMax,
		lightMin, lightMax,
		heightMin, heightMax,
		// Value filters
		rainStatus,
		deviceType,
		controlType
	} = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.createdAt = {};
		if (from) query.createdAt.$gte = from;
		if (to) query.createdAt.$lte = to;
	}

	// Temperature range filter
	if (tempMin !== undefined || tempMax !== undefined) {
		query.temperature = {};
		if (tempMin !== undefined) query.temperature.$gte = parseFloat(tempMin);
		if (tempMax !== undefined) query.temperature.$lte = parseFloat(tempMax);
	}

	// Humidity range filter
	if (humidityMin !== undefined || humidityMax !== undefined) {
		query.humidity = {};
		if (humidityMin !== undefined) query.humidity.$gte = parseFloat(humidityMin);
		if (humidityMax !== undefined) query.humidity.$lte = parseFloat(humidityMax);
	}

	// Soil moisture range filter
	if (soilMin !== undefined || soilMax !== undefined) {
		query.soilMoisture = {};
		if (soilMin !== undefined) query.soilMoisture.$gte = parseFloat(soilMin);
		if (soilMax !== undefined) query.soilMoisture.$lte = parseFloat(soilMax);
	}

	// Water level range filter
	if (waterMin !== undefined || waterMax !== undefined) {
		query.waterLevel = {};
		if (waterMin !== undefined) query.waterLevel.$gte = parseFloat(waterMin);
		if (waterMax !== undefined) query.waterLevel.$lte = parseFloat(waterMax);
	}

	// Light level range filter
	if (lightMin !== undefined || lightMax !== undefined) {
		query.lightLevel = {};
		if (lightMin !== undefined) query.lightLevel.$gte = parseFloat(lightMin);
		if (lightMax !== undefined) query.lightLevel.$lte = parseFloat(lightMax);
	}

	// Plant height range filter
	if (heightMin !== undefined || heightMax !== undefined) {
		query.plantHeight = {};
		if (heightMin !== undefined) query.plantHeight.$gte = parseFloat(heightMin);
		if (heightMax !== undefined) query.plantHeight.$lte = parseFloat(heightMax);
	}

	// Rain status value filter
	if (rainStatus !== undefined) {
		query.rainStatus = parseInt(rainStatus);
	}

	const skip = (page - 1) * limit;

	// Device control query with backend filtering
	const deviceQuery: any = {};
	if (from || to) {
		deviceQuery.timestamp = {};
		if (from) deviceQuery.timestamp.$gte = from;
		if (to) deviceQuery.timestamp.$lte = to;
	}
	if (deviceType && ['light', 'pump', 'door', 'window'].includes(deviceType)) {
		deviceQuery.deviceType = deviceType;
	}
	if (controlType && ['auto', 'manual'].includes(controlType)) {
		deviceQuery.controlType = controlType;
	}

	// Alert query
	const alertQuery: any = {};
	if (from || to) {
		alertQuery.createdAt = {};
		if (from) alertQuery.createdAt.$gte = from;
		if (to) alertQuery.createdAt.$lte = to;
	}

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

	// Get sensor data history with backend filtering
	const [sensorHistory, deviceHistory, deviceControlHistory, alertHistory] = await Promise.all([
		SensorData.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		DeviceStatus.find()
			.sort({ updatedAt: -1 })
			.lean(),
		DeviceHistory.find(deviceQuery)
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Alert.find(alertQuery)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean()
	]);

	const totalSensors = await SensorData.countDocuments(query);
	const totalDeviceControls = await DeviceHistory.countDocuments(deviceQuery);
	const totalAlerts = await Alert.countDocuments(alertQuery);

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
	const {
		from,
		to,
		format = 'json',
		// Range filters
		tempMin, tempMax,
		humidityMin, humidityMax,
		soilMin, soilMax,
		waterMin, waterMax,
		lightMin, lightMax,
		heightMin, heightMax,
		// Value filters
		rainStatus,
		deviceType,
		controlType
	} = req.query as any;

	// Build sensor query with filters
	const sensorQuery: any = {};
	if (from || to) {
		sensorQuery.createdAt = {};
		if (from) sensorQuery.createdAt.$gte = from;
		if (to) sensorQuery.createdAt.$lte = to;
	}

	// Apply range filters for sensors
	if (tempMin !== undefined || tempMax !== undefined) {
		sensorQuery.temperature = {};
		if (tempMin !== undefined) sensorQuery.temperature.$gte = parseFloat(tempMin);
		if (tempMax !== undefined) sensorQuery.temperature.$lte = parseFloat(tempMax);
	}
	if (humidityMin !== undefined || humidityMax !== undefined) {
		sensorQuery.humidity = {};
		if (humidityMin !== undefined) sensorQuery.humidity.$gte = parseFloat(humidityMin);
		if (humidityMax !== undefined) sensorQuery.humidity.$lte = parseFloat(humidityMax);
	}
	if (soilMin !== undefined || soilMax !== undefined) {
		sensorQuery.soilMoisture = {};
		if (soilMin !== undefined) sensorQuery.soilMoisture.$gte = parseFloat(soilMin);
		if (soilMax !== undefined) sensorQuery.soilMoisture.$lte = parseFloat(soilMax);
	}
	if (waterMin !== undefined || waterMax !== undefined) {
		sensorQuery.waterLevel = {};
		if (waterMin !== undefined) sensorQuery.waterLevel.$gte = parseFloat(waterMin);
		if (waterMax !== undefined) sensorQuery.waterLevel.$lte = parseFloat(waterMax);
	}
	if (lightMin !== undefined || lightMax !== undefined) {
		sensorQuery.lightLevel = {};
		if (lightMin !== undefined) sensorQuery.lightLevel.$gte = parseFloat(lightMin);
		if (lightMax !== undefined) sensorQuery.lightLevel.$lte = parseFloat(lightMax);
	}
	if (heightMin !== undefined || heightMax !== undefined) {
		sensorQuery.plantHeight = {};
		if (heightMin !== undefined) sensorQuery.plantHeight.$gte = parseFloat(heightMin);
		if (heightMax !== undefined) sensorQuery.plantHeight.$lte = parseFloat(heightMax);
	}
	if (rainStatus !== undefined) {
		sensorQuery.rainStatus = parseInt(rainStatus);
	}

	// Build device control query
	const deviceQuery: any = {};
	if (from || to) {
		deviceQuery.timestamp = {};
		if (from) deviceQuery.timestamp.$gte = from;
		if (to) deviceQuery.timestamp.$lte = to;
	}
	if (deviceType && ['light', 'pump', 'door', 'window'].includes(deviceType)) {
		deviceQuery.deviceType = deviceType;
	}
	if (controlType && ['auto', 'manual'].includes(controlType)) {
		deviceQuery.controlType = controlType;
	}

	// Build alert query
	const alertQuery: any = {};
	if (from || to) {
		alertQuery.createdAt = {};
		if (from) alertQuery.createdAt.$gte = from;
		if (to) alertQuery.createdAt.$lte = to;
	}

	const [sensors, devices, alerts] = await Promise.all([
		SensorData.find(sensorQuery).sort({ createdAt: -1 }).limit(5000).lean(),
		DeviceStatus.find().sort({ updatedAt: -1 }).lean(),
		Alert.find(alertQuery).sort({ createdAt: -1 }).limit(1000).lean()
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
		// CSV export với filter được áp dụng
		const csvRows = [];

		// Header cho sensors
		csvRows.push('Type,Timestamp,Temperature,Humidity,SoilMoisture,WaterLevel,LightLevel,PlantHeight,RainStatus');

		// Sensor data rows
		sensors.forEach((row: any) => {
			csvRows.push(`sensor,${formatVietnamTimestamp(row.createdAt)},${row.temperature || ''},${row.humidity || ''},${row.soilMoisture || ''},${row.waterLevel || ''},${row.lightLevel || ''},${row.plantHeight || ''},${row.rainStatus || ''}`);
		});

		// Device control data
		const deviceControls = await DeviceHistory.find(deviceQuery).sort({ timestamp: -1 }).limit(1000).lean();

		// Header for device controls
		if (deviceControls.length > 0) {
			csvRows.push(''); // Empty line separator
			csvRows.push('Type,Timestamp,DeviceType,Action,ControlType,Success,Note');
			deviceControls.forEach((row: any) => {
				csvRows.push(`device,${formatVietnamTimestamp(row.timestamp)},${row.deviceType || ''},${row.action || ''},${row.controlType || ''},${row.success || ''},${row.note || ''}`);
			});
		}

		// Alert data
		if (alerts.length > 0) {
			csvRows.push(''); // Empty line separator
			csvRows.push('Type,Timestamp,AlertType,Message,Severity,Resolved');
			alerts.forEach((row: any) => {
				csvRows.push(`alert,${formatVietnamTimestamp(row.createdAt)},${row.type || ''},${row.message || ''},${row.severity || ''},${row.resolved || false}`);
			});
		}

		const csvContent = csvRows.join('\n');

		res.setHeader('Content-Type', 'text/csv; charset=utf-8');
		res.setHeader('Content-Disposition', `attachment; filename=greenhouse-history-export-${Date.now()}.csv`);
		res.send('\uFEFF' + csvContent); // Add BOM for Excel compatibility
	} else {
		// JSON export với thông tin filter chi tiết
		const exportData = {
			exportInfo: {
				exportTime: formatVietnamTimestamp(),
				dateRange: { from, to },
				appliedFilters: {
					temperature: { min: tempMin, max: tempMax },
					humidity: { min: humidityMin, max: humidityMax },
					soilMoisture: { min: soilMin, max: soilMax },
					waterLevel: { min: waterMin, max: waterMax },
					lightLevel: { min: lightMin, max: lightMax },
					plantHeight: { min: heightMin, max: heightMax },
					rainStatus: rainStatus,
					deviceType: deviceType,
					controlType: controlType
				}
			},
			data: {
				sensors: sensors,
				deviceControls: await DeviceHistory.find(deviceQuery).sort({ timestamp: -1 }).limit(1000).lean(),
				alerts: alerts
			},
			summary: {
				totalSensorReadings: sensors.length,
				totalDeviceControls: await DeviceHistory.countDocuments(deviceQuery),
				totalAlerts: alerts.length,
				dateRangeDescription: from && to ?
					`From ${formatVietnamTimestamp(new Date(from))} to ${formatVietnamTimestamp(new Date(to))}` :
					'All available data'
			}
		};

		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		res.setHeader('Content-Disposition', `attachment; filename=greenhouse-history-export-${Date.now()}.json`);
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

export default router;
