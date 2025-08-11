import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { formatVietnamTimestamp } from '../../utils/timezone';
import { DataMergerService } from '../../services/DataMergerService';
import { countService } from '../../services';
import { APIResponse } from '../../types';
export class SensorExportController {
	async exportSensorData(req: Request, res: Response): Promise<void> {
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
		// Apply same filters as main query
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

		if (minTemperature !== undefined || maxTemperature !== undefined) {
			query.temperature = {};
			if (minTemperature !== undefined) query.temperature.$gte = Number(minTemperature);
			if (maxTemperature !== undefined) query.temperature.$lte = Number(maxTemperature);
		}

		if (minHumidity !== undefined || maxHumidity !== undefined) {
			query.humidity = {};
			if (minHumidity !== undefined) query.humidity.$gte = Number(minHumidity);
			if (maxHumidity !== undefined) query.humidity.$lte = Number(maxHumidity);
		}

		if (minSoilMoisture !== undefined || maxSoilMoisture !== undefined) {
			query.soilMoisture = {};
			if (minSoilMoisture !== undefined) query.soilMoisture.$gte = Number(minSoilMoisture);
			if (maxSoilMoisture !== undefined) query.soilMoisture.$lte = Number(maxSoilMoisture);
		}

		if (minWaterLevel !== undefined || maxWaterLevel !== undefined) {
			query.waterLevel = {};
			if (minWaterLevel !== undefined) query.waterLevel.$gte = Number(minWaterLevel);
			if (maxWaterLevel !== undefined) query.waterLevel.$lte = Number(maxWaterLevel);
		}

		if (soilMoisture !== undefined) query.soilMoisture = Number(soilMoisture);
		if (waterLevel !== undefined) query.waterLevel = Number(waterLevel);
		if (rainStatus !== undefined) query.rainStatus = rainStatus;
		const sortCriteria: any = {};
		sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;
		// Get data for export (limit to reasonable size for CSV)
				// **CRITICAL: Ensure data merge before export**
		try {
			console.log('🔄 Ensuring data merge before sensor export...');
			const mergerService = DataMergerService.getInstance();
			
			const mergeStats = await mergerService.mergeSameTimestampData({
				exactDuplicatesOnly: false,
				timeWindowMs: 60000,
				preserveOriginal: false
			});

			if (mergeStats.mergedRecords > 0) {
				console.log('✅ Sensor export pre-query merge completed:', {
					merged: mergeStats.mergedRecords,
					deleted: mergeStats.deletedRecords
				});
			}
		} catch (mergeError) {
			console.warn('⚠️ Sensor export merge failed, continuing:', mergeError);
		}

		const data = await SensorData.find(query)
			.sort(sortCriteria)
			.limit(10000) // Limit for performance
			.lean();
		// Generate CSV content
		const csvHeader = 'Timestamp,Temperature (°C),Humidity (%),Soil Moisture,Water Level,Plant Height (cm),Light Level,Rain Status,Data Quality\n';
		const csvContent = csvHeader + data.map(item => {
			const timestamp = formatVietnamTimestamp(item.createdAt);
			return [
				timestamp,
				item.temperature || '',
				item.humidity || '',
				item.soilMoisture || '',
				item.waterLevel || '',
				item.plantHeight || '',
				item.lightLevel || '',
				item.rainStatus || '',
				item.dataQuality || ''
			].join(',');
		}).join('\n');
		// Set headers for file download
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename=sensor-data.csv');
		res.send(csvContent);
	}

	async getSensorCount(req: Request, res: Response): Promise<void> {
		const { from, to, minTemperature, maxTemperature } = req.query as any;
		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

		if (minTemperature !== undefined || maxTemperature !== undefined) {
			query.temperature = {};
			if (minTemperature !== undefined) query.temperature.$gte = Number(minTemperature);
			if (maxTemperature !== undefined) query.temperature.$lte = Number(maxTemperature);
		}

		const count = await countService.countSensors({ from, to, minTemperature, maxTemperature });
		const response: APIResponse = {
			success: true,
			message: 'Sensor data count retrieved successfully',
			data: { count },
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}
}
