import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';

export class SensorStatsController {
	async getSensorStats(req: Request, res: Response): Promise<void> {
		const { from, to } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const stats = await SensorData.aggregate([
			{ $match: query },
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
					avgWaterLevel: { $avg: '$waterLevel' },
					avgPlantHeight: { $avg: '$plantHeight' },
					totalReadings: { $sum: 1 },
					completeness: {
						$avg: {
							$cond: [{ $eq: ['$dataQuality', 'complete'] }, 1, 0]
						}
					}
				}
			}
		]);

		const statsData = stats[0] || {
			avgTemperature: 0,
			maxTemperature: 0,
			minTemperature: 0,
			avgHumidity: 0,
			maxHumidity: 0,
			minHumidity: 0,
			avgSoilMoisture: 0,
			avgWaterLevel: 0,
			avgPlantHeight: 0,
			totalReadings: 0,
			completeness: 0
		};

		// Round numerical values
		Object.keys(statsData).forEach(key => {
			if (typeof statsData[key] === 'number' && key !== 'totalReadings') {
				statsData[key] = Math.round(statsData[key] * 100) / 100;
			}
		});

		const response: APIResponse = {
			success: true,
			message: 'Sensor statistics retrieved successfully',
			data: statsData,
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}

	async getRealtimeData(req: Request, res: Response): Promise<void> {
		const realtimeData = await SensorData.find()
			.sort({ createdAt: -1 })
			.limit(10)
			.lean();

		const response: APIResponse = {
			success: true,
			message: 'Realtime sensor data retrieved successfully',
			data: realtimeData.reverse(), // Latest first for chart display
			timestamp: new Date().toISOString()
		};

		res.json(response);
	}
}
