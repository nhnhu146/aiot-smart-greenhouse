import { Request, Response } from 'express';
import { APIResponse } from '../../types';
import { formatVietnamTimestamp, formatVietnamTimestampISO } from '../../utils/timezone';
import { DeviceHistory } from '../../models';

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
			const csvHeader = 'Timestamp (UTC+7),Device Type,Status\n';
			const csvRows = deviceHistory.map(device => {
				const timestamp = formatVietnamTimestamp(device.createdAt);
				return `"${timestamp}","${(device.deviceType || '').replace(/"/g, '""')}","${device.status || ''}"`;
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
}