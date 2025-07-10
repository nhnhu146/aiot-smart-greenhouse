import { Router, Request, Response } from 'express';
import { SensorData } from '../models';
import { validateQuery, asyncHandler } from '../middleware';
import { QueryParamsSchema } from '../schemas';
import { APIResponse } from '../types';

const router = Router();

// GET /api/sensors - Lấy dữ liệu cảm biến
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 20, from, to } = req.query as any;

	const query: any = {};

	// Filter by date range if provided
	if (from || to) {
		query.createdAt = {};
		if (from) query.createdAt.$gte = from;
		if (to) query.createdAt.$lte = to;
	}

	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		SensorData.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		SensorData.countDocuments(query)
	]);

	const response: APIResponse = {
		success: true,
		message: 'Sensor data retrieved successfully',
		data: {
			sensors: data,
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

// GET /api/sensors/latest - Lấy dữ liệu cảm biến mới nhất
router.get('/latest', asyncHandler(async (req: Request, res: Response) => {
	const latestData = await SensorData.findOne()
		.sort({ createdAt: -1 })
		.lean();

	const response: APIResponse = {
		success: true,
		message: 'Latest sensor data retrieved successfully',
		data: latestData,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/sensors/stats - Lấy thống kê dữ liệu cảm biến
router.get('/stats', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to } = req.query as any;

	const matchQuery: any = {};
	if (from || to) {
		matchQuery.createdAt = {};
		if (from) matchQuery.createdAt.$gte = from;
		if (to) matchQuery.createdAt.$lte = to;
	}

	const stats = await SensorData.aggregate([
		{ $match: matchQuery },
		{
			$group: {
				_id: null,
				avgTemperature: { $avg: '$temperature' },
				maxTemperature: { $max: '$temperature' },
				minTemperature: { $min: '$temperature' },
				avgHumidity: { $avg: '$humidity' },
				maxHumidity: { $max: '$humidity' },
				minHumidity: { $min: '$humidity' },
				avgSoilMoisture: { $avg: '$soilMoisture' },
				maxSoilMoisture: { $max: '$soilMoisture' },
				minSoilMoisture: { $min: '$soilMoisture' },
				avgWaterLevel: { $avg: '$waterLevel' },
				maxWaterLevel: { $max: '$waterLevel' },
				minWaterLevel: { $min: '$waterLevel' },
				avgPlantHeight: { $avg: '$plantHeight' },
				maxPlantHeight: { $max: '$plantHeight' },
				minPlantHeight: { $min: '$plantHeight' },
				count: { $sum: 1 }
			}
		}
	]);

	const response: APIResponse = {
		success: true,
		message: 'Sensor statistics retrieved successfully',
		data: stats[0] || {},
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/sensors/realtime - Stream dữ liệu realtime (last 10 readings)
router.get('/realtime', asyncHandler(async (req: Request, res: Response) => {
	const realtimeData = await SensorData.find()
		.sort({ createdAt: -1 })
		.limit(10)
		.lean();

	const response: APIResponse = {
		success: true,
		message: 'Realtime sensor data retrieved successfully',
		data: realtimeData,
		timestamp: new Date().toISOString()
	};

	res.json(response);
}));

// GET /api/sensors/current - Lấy trạng thái hiện tại của tất cả cảm biến
router.get('/current', asyncHandler(async (req: Request, res: Response) => {
	const currentData = await SensorData.findOne()
		.sort({ createdAt: -1 })
		.lean();

	if (!currentData) {
		const response: APIResponse = {
			success: false,
			message: 'No sensor data available',
			timestamp: new Date().toISOString()
		};
		return res.status(404).json(response);
	}

	// Calculate time since last update
	const timeSinceUpdate = currentData.createdAt ? Date.now() - new Date(currentData.createdAt).getTime() : 0;
	const isOnline = timeSinceUpdate < 300000; // 5 minutes threshold

	const response: APIResponse = {
		success: true,
		message: 'Current sensor status retrieved successfully',
		data: {
			...currentData,
			isOnline,
			timeSinceUpdate: Math.floor(timeSinceUpdate / 1000), // in seconds
			lastUpdateFormatted: currentData.createdAt ? new Date(currentData.createdAt).toLocaleString() : 'Unknown'
		},
		timestamp: new Date().toISOString()
	};

	return res.json(response);
}));

// GET /api/sensors/export - Export dữ liệu cảm biến (CSV format)
router.get('/export', validateQuery(QueryParamsSchema), asyncHandler(async (req: Request, res: Response) => {
	const { from, to, limit = 1000 } = req.query as any;

	const query: any = {};
	if (from || to) {
		query.createdAt = {};
		if (from) query.createdAt.$gte = from;
		if (to) query.createdAt.$lte = to;
	}

	const data = await SensorData.find(query)
		.sort({ createdAt: -1 })
		.limit(limit)
		.lean();

	// Convert to CSV format
	const csvHeader = 'Timestamp,Temperature,Humidity,SoilMoisture,WaterLevel,PlantHeight,RainStatus\n';
	const csvData = data.map(row =>
		`${row.createdAt},${row.temperature},${row.humidity},${row.soilMoisture},${row.waterLevel},${row.plantHeight},${row.rainStatus}`
	).join('\n');

	const csvContent = csvHeader + csvData;

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', `attachment; filename=sensor-data-${Date.now()}.csv`);
	res.send(csvContent);
}));

export default router;
