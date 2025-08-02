import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { DataMergerService } from '../../services/DataMergerService';

export class SensorHistoryController {
	async getSensorHistory(req: Request, res: Response): Promise<void> {
		const {
			page = 1,
			limit = 100,
			dateFrom,
			dateTo,
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
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = req.query as any;

		const query: any = {};

		// Handle date filters - support both from/to and dateFrom/dateTo
		const fromDate = dateFrom || from;
		const toDate = dateTo || to;

		// Default to last 24 hours if no date range specified
		if (!fromDate && !toDate) {
			const last24Hours = new Date();
			last24Hours.setHours(last24Hours.getHours() - 24);
			query.createdAt = { $gte: last24Hours };
		} else if (fromDate || toDate) {
			query.createdAt = {};
			if (fromDate) query.createdAt.$gte = new Date(fromDate);
			if (toDate) query.createdAt.$lte = new Date(toDate);
		}

		// Add range filters
		if (minTemperature && !isNaN(parseFloat(minTemperature))) {
			query.temperature = { ...query.temperature, $gte: parseFloat(minTemperature) };
		}
		if (maxTemperature && !isNaN(parseFloat(maxTemperature))) {
			query.temperature = { ...query.temperature, $lte: parseFloat(maxTemperature) };
		}
		if (minHumidity && !isNaN(parseFloat(minHumidity))) {
			query.humidity = { ...query.humidity, $gte: parseFloat(minHumidity) };
		}
		if (maxHumidity && !isNaN(parseFloat(maxHumidity))) {
			query.humidity = { ...query.humidity, $lte: parseFloat(maxHumidity) };
		}
		if (minSoilMoisture && !isNaN(parseFloat(minSoilMoisture))) {
			query.soilMoisture = { ...query.soilMoisture, $gte: parseFloat(minSoilMoisture) };
		}
		if (maxSoilMoisture && !isNaN(parseFloat(maxSoilMoisture))) {
			query.soilMoisture = { ...query.soilMoisture, $lte: parseFloat(maxSoilMoisture) };
		}
		if (minWaterLevel && !isNaN(parseFloat(minWaterLevel))) {
			query.waterLevel = { ...query.waterLevel, $gte: parseFloat(minWaterLevel) };
		}
		if (maxWaterLevel && !isNaN(parseFloat(maxWaterLevel))) {
			query.waterLevel = { ...query.waterLevel, $lte: parseFloat(maxWaterLevel) };
		}

		const skip = (page - 1) * limit;

		// Build sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

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
				console.log('✅ Sensor data merged (duplicates found)');
			}
		} catch (mergeError) {
			console.warn('⚠️ Sensor merge failed, continuing:', mergeError);
		}

		const sensorData = await SensorData.find(query)
			.sort(sortObj)
			.skip(skip)
			.limit(limit)
			.lean();

		// Format dates to ensure proper HH:mm:ss format
		const formattedSensorData = sensorData.map(sensor => ({
			...sensor,
			createdAt: sensor.createdAt ? new Date(sensor.createdAt).toISOString() : new Date().toISOString(),
			updatedAt: sensor.updatedAt ? new Date(sensor.updatedAt).toISOString() : new Date().toISOString(),
			// Add formatted timestamp for display
			timestamp: sensor.createdAt ? new Date(sensor.createdAt).toISOString() : new Date().toISOString()
		}));

		const total = await SensorData.countDocuments(query);

		const response: APIResponse = {
			success: true,
			message: 'Sensor history retrieved successfully',
			data: {
				sensors: formattedSensorData,
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
	}

	async getSensorSummary(req: Request, res: Response): Promise<void> {
		const { from, to } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const summary = await SensorData.aggregate([
			{ $match: query },
			{
				$group: {
					_id: null,
					avgTemperature: { $avg: '$temperature' },
					avgHumidity: { $avg: '$humidity' },
					avgSoilMoisture: { $avg: '$soilMoisture' },
					avgWaterLevel: { $avg: '$waterLevel' },
					minTemperature: { $min: '$temperature' },
					maxTemperature: { $max: '$temperature' },
					minHumidity: { $min: '$humidity' },
					maxHumidity: { $max: '$humidity' },
					count: { $sum: 1 }
				}
			}
		]);

		const response: APIResponse = {
			success: true,
			message: 'Sensor summary retrieved successfully',
			data: {
				summary: summary.length > 0 ? summary[0] : {
					avgTemperature: 0,
					avgHumidity: 0,
					avgSoilMoisture: 0,
					avgWaterLevel: 0,
					minTemperature: 0,
					maxTemperature: 0,
					minHumidity: 0,
					maxHumidity: 0,
					count: 0
				}
			},
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	async getSensorTrends(req: Request, res: Response): Promise<void> {
		const { from, to, interval = 'hour' } = req.query as any;

		let dateFormat: string;
		switch (interval) {
			case 'day':
				dateFormat = '%Y-%m-%d';
				break;
			case 'hour':
			default:
				dateFormat = '%Y-%m-%d %H:00:00';
				break;
		}

		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const trends = await SensorData.aggregate([
			{ $match: query },
			{
				$group: {
					_id: {
						$dateToString: {
							format: dateFormat,
							date: '$createdAt'
						}
					},
					avgTemperature: { $avg: '$temperature' },
					avgHumidity: { $avg: '$humidity' },
					avgSoilMoisture: { $avg: '$soilMoisture' },
					avgWaterLevel: { $avg: '$waterLevel' },
					count: { $sum: 1 }
				}
			},
			{ $sort: { _id: 1 } }
		]);

		const response: APIResponse = {
			success: true,
			message: 'Sensor trends retrieved successfully',
			data: {
				trends,
				interval
			},
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}
}
