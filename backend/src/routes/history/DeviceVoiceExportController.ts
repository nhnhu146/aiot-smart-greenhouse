import { Request, Response } from 'express';
import { DeviceHistory, VoiceCommand } from '../../models';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp } from '../../utils/timezone';

export class DeviceVoiceExportController {
	async exportDeviceControls(req: Request, res: Response): Promise<void> {
		const { from, to, format = 'json' } = req.query as any;

		const query: any = {};
		if (from || to) {
			query.timestamp = {};
			if (from) query.timestamp.$gte = from;
			if (to) query.timestamp.$lte = to;
		}

		const deviceHistory = await DeviceHistory.find(query)
			.sort({ timestamp: -1 })
			.lean();

		if (format === 'csv') {
			// Generate CSV
			const csvHeader = 'Timestamp,Device ID,Device Type,Action,Control Type,User ID\n';
			const csvRows = deviceHistory.map(device => {
				const timestamp = formatVietnamTimestamp(device.timestamp);
				return `${timestamp},${device.deviceId},${device.deviceType},${device.action},${device.controlType},${device.userId || 'System'}`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;

			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'attachment; filename=device-controls.csv');
			res.send(csvContent);
		} else {
			// JSON format
			const response: APIResponse = {
				success: true,
				message: 'Device control history exported successfully',
				data: {
					deviceControls: deviceHistory,
					exportedAt: new Date().toISOString(),
					totalRecords: deviceHistory.length
				},
				timestamp: new Date().toISOString()
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
			// Generate CSV
			const csvHeader = 'Timestamp,Command,Confidence\n';
			const csvRows = voiceCommands.map(command => {
				const timestamp = formatVietnamTimestamp(command.timestamp);
				return `${timestamp},"${command.command}",${command.confidence || ''}`;
			}).join('\n');

			const csvContent = csvHeader + csvRows;

			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'attachment; filename=voice-commands.csv');
			res.send(csvContent);
		} else {
			// JSON format
			const response: APIResponse = {
				success: true,
				message: 'Voice commands exported successfully',
				data: {
					voiceCommands,
					exportedAt: new Date().toISOString(),
					totalRecords: voiceCommands.length
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		}
	}
}
