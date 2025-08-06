import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { formatVietnamTimestamp } from '../../utils/timezone';
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
		const query: any = { /* TODO: Implement */ };
		// Apply same filters as main query
		if (from || to) {
			query.createdAt = { /* TODO: Implement */ };
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		if (minTemperature !== undefined || maxTemperature !== undefined) {
			query.temperature = { /* TODO: Implement */ };
			if (minTemperature !== undefined) query.temperature.$gte = minTemperature;
			if (maxTemperature !== undefined) query.temperature.$lte = maxTemperature;
		}

		if (minHumidity !== undefined || maxHumidity !== undefined) {
			query.humidity = { /* TODO: Implement */ };
			if (minHumidity !== undefined) query.humidity.$gte = minHumidity;
			if (maxHumidity !== undefined) query.humidity.$lte = maxHumidity;
		}

		if (minSoilMoisture !== undefined || maxSoilMoisture !== undefined) {
			query.soilMoisture = { /* TODO: Implement */ };
			if (minSoilMoisture !== undefined) query.soilMoisture.$gte = minSoilMoisture;
			if (maxSoilMoisture !== undefined) query.soilMoisture.$lte = maxSoilMoisture;
		}

		if (minWaterLevel !== undefined || maxWaterLevel !== undefined) {
			query.waterLevel = { /* TODO: Implement */ };
			if (minWaterLevel !== undefined) query.waterLevel.$gte = minWaterLevel;
			if (maxWaterLevel !== undefined) query.waterLevel.$lte = maxWaterLevel;
		}

		if (soilMoisture !== undefined) query.soilMoisture = soilMoisture;
		if (waterLevel !== undefined) query.waterLevel = waterLevel;
		if (rainStatus !== undefined) query.rainStatus = rainStatus;
		const sortCriteria: any = { /* TODO: Implement */ };
		sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;
		// Get data for export (limit to reasonable size for CSV)
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
		const query: any = { /* TODO: Implement */ };
		if (from || to) {
			query.createdAt = { /* TODO: Implement */ };
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		if (minTemperature !== undefined || maxTemperature !== undefined) {
			query.temperature = { /* TODO: Implement */ };
			if (minTemperature !== undefined) query.temperature.$gte = minTemperature;
			if (maxTemperature !== undefined) query.temperature.$lte = maxTemperature;
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
