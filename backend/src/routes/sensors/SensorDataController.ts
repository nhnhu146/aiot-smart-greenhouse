import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp } from '../../utils/timezone';

export class SensorDataController {
	async getSensorData(req: Request, res: Response): Promise<void> {
		const {
			page = 1,
			limit = 50,
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
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		// Value range filters
		if (minTemperature !== undefined || maxTemperature !== undefined) {
			query.temperature = {};
			if (minTemperature !== undefined) query.temperature.$gte = minTemperature;
			if (maxTemperature !== undefined) query.temperature.$lte = maxTemperature;
		}

		if (minHumidity !== undefined || maxHumidity !== undefined) {
			query.humidity = {};
			if (minHumidity !== undefined) query.humidity.$gte = minHumidity;
			if (maxHumidity !== undefined) query.humidity.$lte = maxHumidity;
		}

		if (minSoilMoisture !== undefined || maxSoilMoisture !== undefined) {
			query.soilMoisture = {};
			if (minSoilMoisture !== undefined) query.soilMoisture.$gte = minSoilMoisture;
			if (maxSoilMoisture !== undefined) query.soilMoisture.$lte = maxSoilMoisture;
		}

		if (minWaterLevel !== undefined || maxWaterLevel !== undefined) {
			query.waterLevel = {};
			if (minWaterLevel !== undefined) query.waterLevel.$gte = minWaterLevel;
			if (maxWaterLevel !== undefined) query.waterLevel.$lte = maxWaterLevel;
		}

		// Specific value filters
		if (soilMoisture !== undefined) query.soilMoisture = soilMoisture;
		if (waterLevel !== undefined) query.waterLevel = waterLevel;
		if (rainStatus !== undefined) query.rainStatus = rainStatus;

		const skip = (page - 1) * limit;
		const sortCriteria: any = {};
		sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;

		const [data, total] = await Promise.all([
			SensorData.find(query)
				.sort(sortCriteria)
				.skip(skip)
				.limit(Number(limit))
				.lean(),
			SensorData.countDocuments(query)
		]);

		// Format timestamps for Vietnamese timezone
		const formattedData = data.map(item => ({
			...item,
			formattedTime: formatVietnamTimestamp(item.createdAt)
		}));

		const response: APIResponse & { pagination?: any } = {
			success: true,
			message: 'Sensor data retrieved successfully',
			data: formattedData,
			pagination: {
				page: Number(page),
				limit: Number(limit),
				total,
				pages: Math.ceil(total / limit)
			},
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	async getLatestSensorData(req: Request, res: Response): Promise<void> {
		const latestData = await SensorData.findOne()
			.sort({ createdAt: -1 })
			.lean();

		if (!latestData) {
			const response: APIResponse = {
				success: false,
				message: 'No sensor data found',
				data: null,
				timestamp: new Date().toISOString()
			};
			res.status(404).json(response);
			return;
		}

		const formattedData = {
			...latestData,
			formattedTime: formatVietnamTimestamp(latestData.createdAt)
		};

		const response: APIResponse = {
			success: true,
			message: 'Latest sensor data retrieved successfully',
			data: formattedData,
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	async getCurrentSensorStatus(req: Request, res: Response): Promise<void> {
		const latestData = await SensorData.findOne()
			.sort({ createdAt: -1 })
			.lean();

		if (!latestData) {
			const response: APIResponse = {
				success: false,
				message: 'No sensor data found',
				data: null,
				timestamp: new Date().toISOString()
			};
			res.status(404).json(response);
			return;
		}

		const currentStatus = {
			temperature: latestData.temperature,
			humidity: latestData.humidity,
			soilMoisture: latestData.soilMoisture,
			waterLevel: latestData.waterLevel,
			plantHeight: latestData.plantHeight,
			lightLevel: latestData.lightLevel,
			rainStatus: latestData.rainStatus,
			lastUpdate: formatVietnamTimestamp(latestData.createdAt),
			dataQuality: latestData.dataQuality
		};

		const response: APIResponse = {
			success: true,
			message: 'Current sensor status retrieved successfully',
			data: currentStatus,
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}
}
