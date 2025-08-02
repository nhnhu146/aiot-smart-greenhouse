import { Request, Response } from 'express';
import { SensorData } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp } from '../../utils/timezone';

export class SensorExportController {
	async exportSensorData(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const sensorData = await SensorData.find(query)
			.sort({ createdAt: -1 })
			.lean();

		if (format === 'csv') {
			// Generate CSV
			const csvHeader = 'Timestamp,Temperature (°C),Humidity (%),Soil Moisture,Water Level\n';
			const csvRows = sensorData.map(data => {
				const timestamp = formatVietnamTimestamp(data.createdAt);
				return `${timestamp},${data.temperature},${data.humidity},${data.soilMoisture},${data.waterLevel}`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;

			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'attachment; filename=sensor-data.csv');
			res.send(csvContent);
		} else {
			// JSON format
			const response: APIResponse = {
				success: true,
				message: 'Sensor data exported successfully',
				data: {
					sensors: sensorData,
					exportedAt: new Date().toISOString(),
					totalRecords: sensorData.length
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		}
	}
}
