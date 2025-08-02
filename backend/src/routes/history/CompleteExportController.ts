import { Request, Response } from 'express';
import { SensorData, DeviceHistory, VoiceCommand } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp } from '../../utils/timezone';

export class CompleteExportController {
	async exportAllData(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;

		const query: any = {};
		const dateQuery: any = {};

		if (from || to) {
			dateQuery.createdAt = {};
			if (from) dateQuery.createdAt.$gte = from;
			if (to) dateQuery.createdAt.$lte = to;

			query.timestamp = {};
			if (from) query.timestamp.$gte = from;
			if (to) query.timestamp.$lte = to;
		}

		const [sensorData, deviceHistory, voiceCommands] = await Promise.all([
			SensorData.find(dateQuery).sort({ createdAt: -1 }).lean(),
			DeviceHistory.find(query).sort({ timestamp: -1 }).lean(),
			VoiceCommand.find(dateQuery).sort({ timestamp: -1 }).lean()
		]);

		if (format === 'csv') {
			const csvContent = this.generateCompleteCSV(sensorData, deviceHistory, voiceCommands);
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'attachment; filename=complete-history.csv');
			res.send(csvContent);
		} else {
			// JSON format
			const response: APIResponse = {
				success: true,
				message: 'Complete history exported successfully',
				data: {
					sensors: sensorData,
					deviceControls: deviceHistory,
					voiceCommands,
					exportedAt: new Date().toISOString(),
					totalRecords: {
						sensors: sensorData.length,
						deviceControls: deviceHistory.length,
						voiceCommands: voiceCommands.length
					}
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		}
	}

	private generateCompleteCSV(sensorData: any[], deviceHistory: any[], voiceCommands: any[]): string {
		let csvContent = '';

		// Sensor data section
		csvContent += 'SENSOR DATA\n';
		csvContent += 'Timestamp,Temperature (°C),Humidity (%),Soil Moisture,Water Level\n';
		csvContent += sensorData.map(data => {
			const timestamp = formatVietnamTimestamp(data.createdAt);
			return `${timestamp},${data.temperature},${data.humidity},${data.soilMoisture},${data.waterLevel}`;
		}).join('\n');

		csvContent += '\n\nDEVICE CONTROLS\n';
		csvContent += 'Timestamp,Device ID,Device Type,Action,Control Type,User ID\n';
		csvContent += deviceHistory.map(device => {
			const timestamp = formatVietnamTimestamp(device.timestamp);
			return `${timestamp},${device.deviceId},${device.deviceType},${device.action},${device.controlType},${device.userId || 'System'}`;
		}).join('\n');

		csvContent += '\n\nVOICE COMMANDS\n';
		csvContent += 'Timestamp,Command,Confidence\n';
		csvContent += voiceCommands.map(command => {
			const timestamp = formatVietnamTimestamp(command.timestamp);
			return `${timestamp},"${command.command}",${command.confidence || ''}`;
		}).join('\n');

		return csvContent;
	}
}
