import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp, formatVietnamTimestampISO } from '../../utils/timezone';
import { DataMergerService } from '../../services/DataMergerService';
export class SensorExportController {
	async exportSensorData(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;
		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

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
			.sort({ createdAt: -1 })
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
			let csvContent = 'Timestamp (UTC+7),Temperature (°C),Humidity (%),Soil Moisture,Water Level,Plant Height (cm),Light Level,Rain Status\n';
			csvContent += sensorData.map(data => {
				const timestamp = formatVietnamTimestamp(data.createdAt);
				const temperature = formatValue(data.temperature);
				const humidity = formatValue(data.humidity);
				const soilMoisture = formatValue(data.soilMoisture);
				const waterLevel = formatValue(data.waterLevel);
				const plantHeight = formatValue(data.plantHeight);
				const lightLevel = formatValue(data.lightLevel);
				const rainStatus = formatValue(data.rainStatus);
				return `'${timestamp}',${temperature},${humidity},${soilMoisture},${waterLevel},${plantHeight},${lightLevel},${rainStatus}`;
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
}
