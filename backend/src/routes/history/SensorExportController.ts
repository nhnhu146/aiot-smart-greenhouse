import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp, formatVietnamTimestampISO } from '../../utils/timezone';
import { DataMergerService } from '../../services/DataMergerService';

export class SensorExportController {
	async exportSensorData(req: Request, res: Response): Promise<void> {
		const {
			from,
			to,
			format = 'json',
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
		
		// Date range filters
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

		// Temperature range filters
		if (minTemperature !== undefined || maxTemperature !== undefined) {
			query.temperature = {};
			if (minTemperature !== undefined) query.temperature.$gte = Number(minTemperature);
			if (maxTemperature !== undefined) query.temperature.$lte = Number(maxTemperature);
		}

		// Humidity range filters
		if (minHumidity !== undefined || maxHumidity !== undefined) {
			query.humidity = {};
			if (minHumidity !== undefined) query.humidity.$gte = Number(minHumidity);
			if (maxHumidity !== undefined) query.humidity.$lte = Number(maxHumidity);
		}

		// Soil moisture range filters
		if (minSoilMoisture !== undefined || maxSoilMoisture !== undefined) {
			query.soilMoisture = {};
			if (minSoilMoisture !== undefined) query.soilMoisture.$gte = Number(minSoilMoisture);
			if (maxSoilMoisture !== undefined) query.soilMoisture.$lte = Number(maxSoilMoisture);
		}

		// Water level range filters
		if (minWaterLevel !== undefined || maxWaterLevel !== undefined) {
			query.waterLevel = {};
			if (minWaterLevel !== undefined) query.waterLevel.$gte = Number(minWaterLevel);
			if (maxWaterLevel !== undefined) query.waterLevel.$lte = Number(maxWaterLevel);
		}

		// Exact value filters
		if (soilMoisture !== undefined) query.soilMoisture = Number(soilMoisture);
		if (waterLevel !== undefined) query.waterLevel = Number(waterLevel);
		if (rainStatus !== undefined) query.rainStatus = rainStatus;

		// Sort criteria
		const sortCriteria: any = {};
		sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;

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
				console.log('✅ Export pre-query merge completed:', {
					merged: mergeStats.mergedRecords,
					deleted: mergeStats.deletedRecords
				});
			}
		} catch (mergeError) {
			console.warn('⚠️ Export merge failed, continuing:', mergeError);
		}

		const sensorData = await SensorData.find(query)
			.sort(sortCriteria)
			.limit(10000) // Performance limit
			.lean();
		
		// Helper function to format values for CSV
		const formatValue = (value: any): string => {
			if (value === null || value === undefined || value === '') {
				return 'N/A';
			}
			if (value === 0) {
				return '0';
			}
			return String(value);
		};
		
		if (format === 'csv') {
			// Generate CSV with UTC+7 formatted timestamps
			let csvContent = 'Timestamp (UTC+7),Temperature (°C),Humidity (%),Soil Moisture,Water Level,Plant Height (cm),Light Level,Rain Status,Data Quality\n';
			csvContent += sensorData.map(data => {
				const timestamp = formatVietnamTimestamp(data.createdAt);
				const temperature = formatValue(data.temperature);
				const humidity = formatValue(data.humidity);
				const soilMoisture = formatValue(data.soilMoisture);
				const waterLevel = formatValue(data.waterLevel);
				const plantHeight = formatValue(data.plantHeight);
				const lightLevel = formatValue(data.lightLevel);
				const rainStatus = formatValue(data.rainStatus);
				const dataQuality = formatValue(data.dataQuality);
				return `'${timestamp}',${temperature},${humidity},${soilMoisture},${waterLevel},${plantHeight},${lightLevel},${rainStatus},${dataQuality}`;
			}).join('\n');
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=sensor-data.csv');
			res.send(csvContent);
		} else {
			// JSON format with UTC+7 timestamps
			const formattedData = sensorData.map(data => ({
				...data,
				timestamp: formatVietnamTimestampISO(data.createdAt),
				createdAt: formatVietnamTimestampISO(data.createdAt)
			}));
			const response: APIResponse = {
				success: true,
				message: 'Sensor data exported successfully',
				data: {
					sensors: formattedData,
					exportedAt: formatVietnamTimestampISO(new Date()),
					totalRecords: sensorData.length,
					timezone: 'UTC+7'
				},
				timestamp: formatVietnamTimestampISO(new Date())
			};
			// JSON format with proper download headers
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=sensor-data.json');
			res.send(JSON.stringify(response, null, 2));
		}
	}

	async getSensorCount(req: Request, res: Response): Promise<void> {
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
			rainStatus
		} = req.query as any;
		
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

		const count = await SensorData.countDocuments(query);
		const response: APIResponse = {
			success: true,
			message: 'Sensor data count retrieved successfully',
			data: { count },
			timestamp: formatVietnamTimestampISO(new Date())
		};
		res.json(response);
	}
}