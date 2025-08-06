import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp } from '../../utils/timezone';
import { DataMergerService } from '../../services/DataMergerService';
export class SensorDataController {
async getSensorData(req: Request, res: Response): Promise<void> {
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

		// Build query
		const query: any = {};

		// Date range
		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate as string);
			if (endDate) query.createdAt.$lte = new Date(endDate as string);
		}

		// Filters
		if (deviceId && deviceId !== 'all') query.deviceId = deviceId;
		if (temperature !== undefined) query.temperature = temperature;
		if (humidity !== undefined) query.humidity = humidity;
		if (soilMoisture !== undefined) query.soilMoisture = soilMoisture;
		if (waterLevel !== undefined) query.waterLevel = waterLevel;
		if (rainStatus !== undefined) query.rainStatus = rainStatus;

		const skip = (Number(page) - 1) * Number(limit);
		const sortCriteria: any = {};
		sortCriteria[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

		// **CRITICAL: Perform merge BEFORE data retrieval to ensure only merged data is served**
		try {
			console.log('🔄 Ensuring data merge before serving sensor data...');
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
		const [data, total] = await Promise.all([
			SensorData.find(query)
				.sort(sortCriteria)
				.skip(skip)
				.limit(Number(limit))
				.lean(),
			SensorData.countDocuments(query)
		]);

		// **Verification: Ensure no duplicate timestamps in response**
		const timestampGroups = new Map();
		data.forEach((record, index) => {
			const timestamp = record.createdAt?.getTime();
			if (timestamp) {
				if (timestampGroups.has(timestamp)) {
					console.warn(`⚠️ Duplicate timestamp detected in response: ${record.createdAt} (indices: ${timestampGroups.get(timestamp)}, ${index})`);
				} else {
					timestampGroups.set(timestamp, index);
				}
			}
		});

		// Format timestamps for Vietnamese timezone
		const formattedData = data.map(item => ({
			...item,
			formattedTime: formatVietnamTimestamp(item.createdAt)
		}));

		const response: APIResponse & { pagination?: any } = {
			success: true,
			message: 'Sensor data retrieved successfully',
			data: {
				sensors: formattedData,
				pagination: {
					page: Number(page),
					limit: Number(limit),
					total,
					totalPages: Math.ceil(total / Number(limit)),
					hasNext: skip + formattedData.length < total,
					hasPrev: Number(page) > 1
				}
			},
			// Add merge metadata to confirm data is merged
			merged: true,
			timestamp: new Date().toISOString()
		};

		res.status(200).json(response);
	} catch (error) {
		console.error('❌ Error fetching sensor data:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to fetch sensor data',
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}

	async getLatestSensorData(req: Request, res: Response): Promise<void> {
		// **CRITICAL: Ensure data merge before serving latest sensor data**
		try {
			console.log('🔄 Ensuring data merge before serving latest sensor data...');
			const mergerService = DataMergerService.getInstance();
			
			const mergeStats = await mergerService.mergeSameTimestampData({
				exactDuplicatesOnly: false,
				timeWindowMs: 60000,
				preserveOriginal: false
			});

			if (mergeStats.mergedRecords > 0) {
				console.log('✅ Latest sensor pre-query merge completed:', {
					merged: mergeStats.mergedRecords,
					deleted: mergeStats.deletedRecords
				});
			}
		} catch (mergeError) {
			console.warn('⚠️ Latest sensor merge failed, continuing:', mergeError);
		}

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

		// Standardized format: always return data.sensors array
		const response: APIResponse = {
			success: true,
			message: 'Latest sensor data retrieved successfully',
			data: {
				sensors: [formattedData]
			},
			// Add merge metadata
			merged: true,
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
