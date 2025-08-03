import { Request, Response } from 'express';
import { DeviceHistory, VoiceCommand } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp, formatVietnamTimestampISO } from '../../utils/timezone';

export class DeviceVoiceExportController {
	async exportDeviceControls(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const deviceHistory = await DeviceHistory.find(query)
			.sort({ timestamp: -1 })
			.lean();

		if (format === 'csv') {
			// Generate CSV with UTC+7 formatted timestamps
			const csvHeader = 'Timestamp (UTC+7),Device ID,Device Type,Action,Control Type,User ID\n';
			const csvRows = deviceHistory.map(device => {
				const timestamp = formatVietnamTimestamp(device.createdAt);
				return `"${timestamp}","${device.deviceId || ''}","${device.deviceType || ''}","${device.action || ''}","${device.controlType || ''}","${device.userId || 'System'}"`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;

			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=device-controls.csv');
			res.send(csvContent);
		} else {
			// JSON format with UTC+7 timestamps
			const formattedData = deviceHistory.map(device => ({
				...device,
				timestamp: formatVietnamTimestampISO(device.createdAt)
			}));

			const response: APIResponse = {
				success: true,
				message: 'Device control history exported successfully',
				data: {
					deviceControls: formattedData,
					exportedAt: formatVietnamTimestampISO(new Date()),
					totalRecords: deviceHistory.length,
					timezone: 'UTC+7'
				},
				timestamp: formatVietnamTimestampISO(new Date())
			};

			res.json(response);
		}
	}

	async exportVoiceCommands(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.createdAt = {};
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const voiceCommands = await VoiceCommand.find(query)
			.sort({ timestamp: -1 })
			.lean();

		if (format === 'csv') {
			// Generate CSV with UTC+7 formatted timestamps
			const csvHeader = 'Timestamp (UTC+7),Command,Confidence\n';
			const csvRows = voiceCommands.map(command => {
				const timestamp = formatVietnamTimestamp(command.createdAt);
				return `"${timestamp}","${(command.command || '').replace(/"/g, '""')}","${command.confidence || ''}"`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;

			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=voice-commands.csv');
			res.send(csvContent);
		} else {
			// JSON format with UTC+7 timestamps
			const formattedData = voiceCommands.map(command => ({
				...command,
				timestamp: formatVietnamTimestampISO(command.createdAt)
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

			res.json(response);
		}
	}
}
