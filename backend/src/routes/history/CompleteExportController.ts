import { Request, Response } from 'express';
import { SensorData, DeviceHistory, VoiceCommand } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp, formatVietnamTimestampISO } from '../../utils/timezone';

export class CompleteExportController {
	async exportAllData(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;

		const query: any = {};
		const dateQuery: any = {};

		if (from || to) {
			dateQuery.createdAt = {};
			if (from) dateQuery.createdAt.$gte = from;
			if (to) dateQuery.createdAt.$lte = to;

			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const [sensorData, deviceHistory, voiceCommands] = await Promise.all([
			SensorData.find(dateQuery).sort({ createdAt: -1 }).lean(),
			DeviceHistory.find(query).sort({ timestamp: -1 }).lean(),
			VoiceCommand.find(dateQuery).sort({ timestamp: -1 }).lean()
		]);

		if (format === 'csv') {
			const csvContent = this.generateCompleteCSV(sensorData, deviceHistory, voiceCommands);
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=complete-history.csv');
			res.send(csvContent);
		} else {
			// JSON format with UTC+7 timestamps
			const formattedSensorData = sensorData.map(data => ({
				...data,
				timestamp: formatVietnamTimestampISO(data.createdAt),
				createdAt: formatVietnamTimestampISO(data.createdAt)
			}));

			const formattedDeviceHistory = deviceHistory.map(device => ({
				...device,
				timestamp: formatVietnamTimestampISO(device.createdAt)
			}));

			const formattedVoiceCommands = voiceCommands.map(command => ({
				...command,
				timestamp: formatVietnamTimestampISO(command.createdAt)
			}));

			const response: APIResponse = {
				success: true,
				message: 'Complete history exported successfully',
				data: {
					sensors: formattedSensorData,
					deviceControls: formattedDeviceHistory,
					voiceCommands: formattedVoiceCommands,
					exportedAt: formatVietnamTimestampISO(new Date()),
					totalRecords: {
						sensors: sensorData.length,
						deviceControls: deviceHistory.length,
						voiceCommands: voiceCommands.length
					},
					timezone: 'UTC+7'
				},
				timestamp: formatVietnamTimestampISO(new Date())
			};

			res.json(response);
		}
	}

	private generateCompleteCSV(sensorData: any[], deviceHistory: any[], voiceCommands: any[]): string {
		let csvContent = '';

		// Sensor data section
		csvContent += 'SENSOR DATA\n';
		csvContent += 'Timestamp (UTC+7),Temperature (°C),Humidity (%),Soil Moisture,Water Level\n';
		csvContent += sensorData.map(data => {
			const timestamp = formatVietnamTimestamp(data.createdAt);
			return `"${timestamp}",${data.temperature || ''},${data.humidity || ''},${data.soilMoisture || ''},${data.waterLevel || ''}`;
		}).join('\n');

		csvContent += '\n\nDEVICE CONTROLS\n';
		csvContent += 'Timestamp (UTC+7),Device ID,Device Type,Action,Control Type,User ID\n';
		csvContent += deviceHistory.map(device => {
			const timestamp = formatVietnamTimestamp(device.createdAt);
			return `"${timestamp}","${device.deviceId || ''}","${device.deviceType || ''}","${device.action || ''}","${device.controlType || ''}","${device.userId || 'System'}"`;
		}).join('\n');

		csvContent += '\n\nVOICE COMMANDS\n';
		csvContent += 'Timestamp (UTC+7),Command,Confidence\n';
		csvContent += voiceCommands.map(command => {
			const timestamp = formatVietnamTimestamp(command.createdAt);
			return `"${timestamp}","${(command.command || '').replace(/"/g, '""')}","${command.confidence || ''}"`;
		}).join('\n');

		return csvContent;
	}
}
