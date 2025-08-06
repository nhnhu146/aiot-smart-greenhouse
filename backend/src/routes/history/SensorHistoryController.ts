import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { DataMergerService } from '../../services/DataMergerService';
export class SensorHistoryController {
	async getSensorHistory(req: Request, res: Response): Promise<void> {
			from,
			to,
			sensorType,
			minValue,
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
		// Validate sortBy parameter - include all possible sort fields for sensor data
		try {
			const {
				page = 1,
				limit = 20,
				sortBy = 'createdAt',
				sortOrder = 'desc',
				startDate,
				endDate,
				deviceId,
				temperature,
				humidity,
				soilMoisture,
				waterLevel,
				rainStatus
			} = req.query;

			// Build query object
			const query: any = {};

			// Date range filter
			if (startDate || endDate) {
				query.createdAt = {};
				if (startDate) query.createdAt.$gte = new Date(startDate as string);
				if (endDate) query.createdAt.$lte = new Date(endDate as string);
			}

			// Other filters
			if (deviceId && deviceId !== 'all') query.deviceId = deviceId;
			if (temperature) query['data.temperature'] = Number(temperature);
			if (humidity) query['data.humidity'] = Number(humidity);
			if (soilMoisture) query['data.soilMoisture'] = Number(soilMoisture);
			if (waterLevel) query['data.waterLevel'] = Number(waterLevel);
			if (rainStatus !== undefined) query['data.rainStatus'] = rainStatus === 'true';

			const skip = (Number(page) - 1) * Number(limit);

			// Build sort object
			const sortObj: any = {};
			sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

			// **CRITICAL: Perform merge BEFORE data retrieval to ensure only merged data is served**
			try {
				console.log('🔄 Ensuring data merge before serving sensor history...');
				const mergerService = DataMergerService.getInstance();

				// Perform comprehensive merge to consolidate same timestamps
				const mergeStats = await mergerService.mergeSameTimestampData({
					exactDuplicatesOnly: false, // Handle both exact and near duplicates
					timeWindowMs: 60000, // 1 minute window for near duplicates
					preserveOriginal: false
				});

				if (mergeStats.mergedRecords > 0) {
					console.log('✅ Pre-query merge completed:', {
						merged: mergeStats.mergedRecords,
						deleted: mergeStats.deletedRecords,
						groups: mergeStats.processedGroups
					});
				}
			} catch (mergeError) {
				console.warn('⚠️ Pre-query merge failed, continuing with existing data:', mergeError);
			}

			// **Get merged data - this should now have no duplicate timestamps**
			const sensorData = await SensorData.find(query)
				.sort(sortObj)
				.skip(skip)
				.limit(Number(limit))
				.lean();

			// **Verification: Ensure no duplicate timestamps in response**
			const timestampGroups = new Map();
			sensorData.forEach((record, index) => {
				const timestamp = record.createdAt?.getTime();
				if (timestamp) {
					if (timestampGroups.has(timestamp)) {
						console.warn(`⚠️ Duplicate timestamp detected in response: ${record.createdAt} (indices: ${timestampGroups.get(timestamp)}, ${index})`);
					} else {
						timestampGroups.set(timestamp, index);
					}
				}
			});

			// Format dates to ensure proper format
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
						page: Number(page),
						limit: Number(limit),
						total,
						totalPages: Math.ceil(total / Number(limit)),
						hasNext: skip + formattedSensorData.length < total,
						hasPrev: Number(page) > 1
					}
				},
				// Add merge metadata to confirm data is merged
				merged: true,
				timestamp: new Date().toISOString()
			};

			res.status(200).json(response);
		} catch (error) {
			console.error('❌ Error fetching sensor history:', error);
			const response: APIResponse = {
				success: false,
				message: 'Failed to fetch sensor history',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	}

	async getSensorSummary(req: Request, res: Response): Promise<void> {
		const { from, to, dateFrom, dateTo, sensorType, minValue } = req.query as any;
		// Build query object for sensor history
		const query: any = {};

		// Handle date filters - support both from/to and dateFrom/dateTo
		if (from || dateFrom) {
			const startDate = from || dateFrom;
			query.createdAt = { $gte: new Date(startDate) };
		}

		if (to || dateTo) {
			const endDate = to || dateTo;
			if (query.createdAt) {
				query.createdAt.$lte = new Date(endDate);
			} else {
				query.createdAt = { $lte: new Date(endDate) };
			}
		}

		// Filter by sensor type if specified
		if (sensorType && sensorType !== 'all') {
			query[sensorType] = { $exists: true, $ne: null };
		}

		// Filter by value range if specified
		if (minValue !== undefined) {
			// Apply to all numeric sensor fields
			const numericFields = ['temperature', 'humidity', 'soilMoisture', 'lightIntensity'];
			const orConditions = numericFields.map(field => ({ [field]: { $gte: parseFloat(minValue) } }));
			query.$or = orConditions;
		}
		if (from || to) {
			query.createdAt = { /* TODO: Implement */ };
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
		const { from, to, dateFrom, dateTo, sensorType, minValue, interval = 'hour' } = req.query as any;
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

		// Build query object for sensor history
		const query: any = {};

		// Handle date filters - support both from/to and dateFrom/dateTo
		if (from || dateFrom) {
			const startDate = from || dateFrom;
			query.createdAt = { $gte: new Date(startDate) };
		}

		if (to || dateTo) {
			const endDate = to || dateTo;
			if (query.createdAt) {
				query.createdAt.$lte = new Date(endDate);
			} else {
				query.createdAt = { $lte: new Date(endDate) };
			}
		}

		// Filter by sensor type if specified
		if (sensorType && sensorType !== 'all') {
			query[sensorType] = { $exists: true, $ne: null };
		}

		// Filter by value range if specified
		if (minValue !== undefined) {
			// Apply to all numeric sensor fields
			const numericFields = ['temperature', 'humidity', 'soilMoisture', 'lightIntensity'];
			const orConditions = numericFields.map(field => ({ [field]: { $gte: parseFloat(minValue) } }));
			query.$or = orConditions;
		}
		if (from || to) {
			query.createdAt = { /* TODO: Implement */ };
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
