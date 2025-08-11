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
			if (from) dateQuery.createdAt.$gte = new Date(from);
			if (to) dateQuery.createdAt.$lte = new Date(to);
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

		const [sensorData, deviceHistory, voiceCommands] = await Promise.all([
			SensorData.find(dateQuery).sort({ createdAt: -1 }).lean(),
			DeviceHistory.find(query).sort({ timestamp: -1 }).lean(),
			VoiceCommand.find(dateQuery).sort({ timestamp: -1 }).lean()
		]);
		if (format === 'csv') {
			const csvContent = this.generateCompleteCSV(sensorData, deviceHistory);
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
			// JSON format with proper download headers
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=complete-history.json');
			res.send(JSON.stringify(response, null, 2));
		}
	}

	private generateCompleteCSV(sensorData: any[], deviceHistory: any[]): string {
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

		let csvContent = '';
		// Sensor data section
		csvContent += 'SENSOR DATA\n';
		csvContent += 'Timestamp (UTC+7),Temperature (°C),Humidity (%),Soil Moisture,Water Level,Plant Height (cm),Light Level,Rain Status\n';
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

		csvContent += '\n\nDEVICE CONTROLS\n';
		csvContent += 'Timestamp (UTC+7),Device ID,Device Type,Status,Action,Control Type,User ID,Triggered By,Success,Duration (s),Sensor Value,Error Message\n';
		csvContent += deviceHistory.map(device => {
			const timestamp = formatVietnamTimestamp(device.createdAt);
			const deviceId = formatValue(device.deviceId);
			const deviceType = formatValue(device.deviceType);
			const status = formatValue(device.status);
			const action = formatValue(device.action);
			const controlType = formatValue(device.controlType);
			const userId = formatValue(device.userId);
			const triggeredBy = formatValue(device.triggeredBy);
			const success = formatValue(device.success);
			const duration = formatValue(device.duration);
			const sensorValue = formatValue(device.sensorValue);
			const errorMessage = formatValue(device.errorMessage);
			return `'${timestamp}',"${deviceId.replace(/"/g, '""')}","${deviceType.replace(/"/g, '""')}","${status.replace(/"/g, '""')}","${action.replace(/"/g, '""')}","${controlType.replace(/"/g, '""')}","${userId.replace(/"/g, '""')}","${triggeredBy.replace(/"/g, '""')}","${success.replace(/"/g, '""')}","${duration.replace(/"/g, '""')}","${sensorValue.replace(/"/g, '""')}","${errorMessage.replace(/"/g, '""')}"`;
		}).join('\n');

		return csvContent;
	}
}
