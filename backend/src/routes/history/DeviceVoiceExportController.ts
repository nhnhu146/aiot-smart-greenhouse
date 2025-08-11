import { Request, Response } from 'express';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp, formatVietnamTimestampISO } from '../../utils/timezone';
import { DeviceHistory, VoiceCommand } from '../../models';

export class DeviceVoiceExportController {
	async exportDeviceControls(req: Request, res: Response): Promise<void> {
		const {
			from,
			to,
			format = 'json',
			deviceType,
			device,
			controlType,
			action,
			userId,
			triggeredBy,
			success,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = req.query as any;
		const query: any = {};

		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

		// Apply device-specific filters
		if (deviceType && deviceType !== '') query.deviceType = deviceType;
		if (device && device !== '') query.device = device;
		if (controlType && controlType !== '') query.controlType = controlType;
		if (action && action !== '') query.action = action;
		if (userId && userId !== '') query.userId = userId;
		if (triggeredBy && triggeredBy !== '') query.triggeredBy = triggeredBy;
		if (success !== undefined && success !== '') query.success = success === 'true';

				// Apply sort parameters
		const sortCriteria: any = {};
		sortCriteria[sortBy === 'timestamp' ? 'createdAt' : sortBy] = sortOrder === 'asc' ? 1 : -1;
		
		const deviceHistory = await DeviceHistory.find(query)
			.sort(sortCriteria)
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
						const csvHeader = 'Timestamp (UTC+7),Device Type,Device ID,Status,Action,Control Type,User ID,Triggered By,Success,Duration (s),Sensor Value,Error Message\n';
			const csvRows = deviceHistory.map(device => {
				const timestamp = formatVietnamTimestamp(device.createdAt);
				const deviceType = formatValue(device.deviceType);
				const deviceId = formatValue(device.deviceId);
				const status = formatValue(device.status);
				const action = formatValue(device.action);
				const controlType = formatValue(device.controlType);
				const userId = formatValue(device.userId);
				const triggeredBy = formatValue(device.triggeredBy);
								const success = formatValue(device.success);
				const duration = formatValue(device.duration);
				const sensorValue = formatValue(device.sensorValue);
				const errorMessage = formatValue(device.errorMessage);
				
				return `"${timestamp}","${deviceType.replace(/"/g, '""')}","${deviceId.replace(/"/g, '""')}","${status.replace(/"/g, '""')}","${action.replace(/"/g, '""')}","${controlType.replace(/"/g, '""')}","${userId.replace(/"/g, '""')}","${triggeredBy.replace(/"/g, '""')}","${success.replace(/"/g, '""')}","${duration.replace(/"/g, '""')}","${sensorValue.replace(/"/g, '""')}","${errorMessage.replace(/"/g, '""')}"`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=device-controls.csv');
			res.send(csvContent);
		} else {
			// JSON format with UTC+7 timestamps
			const formattedData = deviceHistory.map(command => ({
				...command,
				timestamp: formatVietnamTimestampISO(command.createdAt)
			}));

			const response: APIResponse = {
				success: true,
				message: 'Device controls exported successfully',
				data: {
					deviceHistory: formattedData,
					exportedAt: formatVietnamTimestampISO(new Date()),
					totalRecords: deviceHistory.length,
					timezone: 'UTC+7'
				},
				timestamp: formatVietnamTimestampISO(new Date())
			};
			// JSON format with proper download headers
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=device-controls.json');
			res.send(JSON.stringify(response, null, 2));
		}
	}

	async exportVoiceCommands(req: Request, res: Response): Promise<void> {
		const {
			from,
			to,
			format = 'json',
			command,
			processed,
			minConfidence,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = req.query as any;

		const query: any = {};

		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = new Date(from);
			if (to) query.createdAt.$lte = new Date(to);
		}

		// Apply voice command specific filters
		if (command && command.trim() !== '') {
			query.command = { $regex: command.trim(), $options: 'i' };
		}
		if (processed !== undefined && processed !== '') {
			query.processed = processed === 'true';
		}
		if (minConfidence && !isNaN(parseFloat(minConfidence))) {
			query.confidence = { $gte: parseFloat(minConfidence) };
		}

				// Apply sort parameters
		const sortCriteria: any = {};
		sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;
		
		const voiceCommands = await VoiceCommand.find(query)
			.sort(sortCriteria)
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
			const csvHeader = 'Timestamp (UTC+7),Command,Confidence,Processed,Error Message\n';
			const csvRows = voiceCommands.map(voice => {
				const timestamp = formatVietnamTimestamp(voice.createdAt);
				const command = formatValue(voice.command);
				let confidence = 'N/A';
				if (voice.confidence !== null && voice.confidence !== undefined) {
					if (voice.confidence === 0) {
						confidence = '0%';
					} else {
						confidence = (voice.confidence * 100).toFixed(1) + '%';
					}
				}
				const processed = voice.processed ? 'Yes' : 'No';
				const errorMsg = formatValue(voice.errorMessage);
				
				return `"${timestamp}","${command.replace(/"/g, '""')}","${confidence}","${processed}","${errorMsg.replace(/"/g, '""')}"`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=voice-commands.csv');
			res.send(csvContent);
		} else {
			// JSON format with UTC+7 timestamps
			const formattedData = voiceCommands.map(voice => ({
				...voice,
				timestamp: formatVietnamTimestampISO(voice.createdAt)
			}));

			const response: APIResponse = {
				success: true,
				message: 'Voice commands exported successfully',
				data: {
					voiceCommands: formattedData,
					exportedAt: formatVietnamTimestampISO(new Date()),
					totalRecords: voiceCommands.length,
					timezone: 'UTC+7'
				},
				timestamp: formatVietnamTimestampISO(new Date())
			};
			// JSON format with proper download headers
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=voice-commands.json');
			res.send(JSON.stringify(response, null, 2));
		}
	}
}