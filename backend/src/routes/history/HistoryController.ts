import { Request, Response } from 'express';
import { SensorData, DeviceStatus, DeviceHistory, Alert } from '../../models';
import { APIResponse } from '../../types';
import { DataMergerService } from '../../services/DataMergerService';
export class HistoryController {
	async getGeneralHistory(req: Request, res: Response): Promise<void> {
		const { page = 1, limit = 50, from, to } = req.query as any;
		const query: any = { /* TODO: Implement */ };
		// Filter by date range if provided
		if (from || to) {
			query.createdAt = { /* TODO: Implement */ };
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
			DeviceHistory.find(query.createdAt ? { timestamp: query.createdAt } : { /* TODO: Implement */ })
				.sort({ timestamp: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Alert.find(query.createdAt ? { createdAt: query.createdAt } : { /* TODO: Implement */ })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean()
		]);
		const totalSensors = await SensorData.countDocuments(query);
		const totalDeviceControls = await DeviceHistory.countDocuments(query.createdAt ? { timestamp: query.createdAt } : { /* TODO: Implement */ });
		const totalAlerts = await Alert.countDocuments(query.createdAt ? { createdAt: query.createdAt } : { /* TODO: Implement */ });
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
	}
}
