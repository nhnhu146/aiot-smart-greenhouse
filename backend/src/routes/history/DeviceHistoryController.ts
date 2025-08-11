import { Request, Response } from 'express';
import { APIResponse } from '../../types';
import { DeviceHistory } from '../../models';
export class DeviceHistoryController {
	async getDeviceHistory(req: Request, res: Response): Promise<void> {
		const { 
			page = 1, 
			limit = 50, 
			from, 
			to, 
			dateFrom, 
			dateTo, 
			deviceType, 
			action, 
			source 
		} = req.query as any;
		// Build query object for device history
		const query: any = {};
		
		// Handle date filters - support both from/to and dateFrom/dateTo
		if (from || dateFrom) {
			const startDate = from || dateFrom;
			query.createdAt = { $gte: new Date(startDate) };
		}
		
		if (to || dateTo) {
			const endDate = to || dateTo;
			if (query.createdAt) {
				query.createdAt.$lte = new Date(endDate);
			} else {
				query.createdAt = { $lte: new Date(endDate) };
			}
		}
		
		// Filter by device type if specified
		if (deviceType && deviceType !== 'all') {
			query.deviceType = deviceType;
		}
		
		// Filter by action if specified
		if (action) {
			query.action = action;
		}
		
		// Filter by source (manual, automation, etc.)
		if (source) {
			query.source = source;
		}
		if (from || to) {
			query.createdAt = { /* TODO: Implement */ };
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
		}

		const skip = (page - 1) * limit;
		const deviceHistory = await DeviceHistory.find(query)
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean();
		const total = await DeviceHistory.countDocuments(query);
		const response: APIResponse = {
			success: true,
			message: 'Device history retrieved successfully',
			data: {
				devices: deviceHistory,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasNext: page < Math.ceil(total / limit),
					hasPrev: page > 1
				}
			},
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	async getDeviceControlHistory(req: Request, res: Response): Promise<void> {
		const {
			page = 1,
			limit = 50,
			dateFrom,
			dateTo,
			from,
			to,
			deviceType,
			deviceId,
			controlType,
			action,
			source,
			userId,
			triggeredBy,
			success,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = req.query as any;
		// Validate sortBy parameter - include all possible sort fields
		const validSortFields = ['createdAt', 'deviceType', 'action', 'status', 'controlType', 'triggeredBy', 'userId', 'deviceId', 'success'];
		const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
		// Log sort parameters for debugging
		console.log(`🔍 DeviceHistory sort - sortBy: ${sortBy}, actualSortBy: ${actualSortBy}, sortOrder: ${sortOrder}`);
		// Build query object for device history
		const query: any = {};
		
		// Handle date filters - support both from/to and dateFrom/dateTo
		if (from || dateFrom) {
			const startDate = from || dateFrom;
			query.createdAt = { $gte: new Date(startDate) };
		}
		
		if (to || dateTo) {
			const endDate = to || dateTo;
			if (query.createdAt) {
				query.createdAt.$lte = new Date(endDate);
			} else {
				query.createdAt = { $lte: new Date(endDate) };
			}
		}
		
		// Filter by device type if specified
		if (deviceType && deviceType !== 'all') {
			query.deviceType = deviceType;
		}
		
		// Filter by action if specified
		if (action) {
			query.action = action;
		}
		
		// Filter by source (manual, automation, etc.)
		if (source) {
			query.source = source;
		}
		// Handle date filters - support both from/to and dateFrom/dateTo
		const fromDate = dateFrom || from;
		const toDate = dateTo || to;
		if (fromDate || toDate) {
			query.createdAt = { /* TODO: Implement */ };
			if (fromDate) query.createdAt.$gte = new Date(fromDate);
			if (toDate) query.createdAt.$lte = new Date(toDate);
		}

		// Device filters
		if (deviceType && deviceType.trim() !== '') {
			query.deviceType = deviceType;
		}

		if (deviceId && deviceId.trim() !== '') {
			query.deviceId = deviceId;
		}

		// Control type filter (auto/manual)
		if (controlType && controlType.trim() !== '') {
			query.controlType = controlType;
		}

		// Action filter (on/off/open/close)
		if (action && action.trim() !== '') {
			query.action = action;
		}

		// User ID filter for manual controls
		if (userId && userId.trim() !== '') {
			query.userId = { $regex: userId, $options: 'i' };
		}

		// Triggered by filter for automation controls
		if (triggeredBy && triggeredBy.trim() !== '') {
			query.triggeredBy = { $regex: triggeredBy, $options: 'i' };
		}

		// Success filter
		if (success !== undefined && success !== '') {
			query.success = success === 'true';
		}

		const skip = (page - 1) * limit;
		// Build sort object
		const sortObj: any = { /* TODO: Implement */ };
		sortObj[actualSortBy] = sortOrder === 'asc' ? 1 : -1;
		const deviceControls = await DeviceHistory.find(query)
			.sort(sortObj)
			.skip(skip)
			.limit(limit)
			.lean();
		const total = await DeviceHistory.countDocuments(query);
		// Format timestamps for consistent display
		const formattedDeviceControls = deviceControls.map(control => ({
			...control,
			timestamp: control.createdAt ? control.createdAt.toISOString() : new Date().toISOString()
		}));
		const response: APIResponse = {
			success: true,
			message: 'Device control history retrieved successfully',
			data: {
				deviceControls: formattedDeviceControls,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasNext: page < Math.ceil(total / limit),
					hasPrev: page > 1
				},
				filters: {
					applied: {
						dateFrom: fromDate,
						dateTo: toDate,
						deviceType,
						deviceId,
						controlType,
						action,
						userId,
						triggeredBy,
						success
					}
				}
			},
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	async getDeviceControlCount(req: Request, res: Response): Promise<void> {
		const { from, to, dateFrom, dateTo, deviceType, action, source } = req.query as any;
		try {
			// Build query object for device history
		const query: any = {};
		
		// Handle date filters - support both from/to and dateFrom/dateTo
		if (from || dateFrom) {
			const startDate = from || dateFrom;
			query.createdAt = { $gte: new Date(startDate) };
		}
		
		if (to || dateTo) {
			const endDate = to || dateTo;
			if (query.createdAt) {
				query.createdAt.$lte = new Date(endDate);
			} else {
				query.createdAt = { $lte: new Date(endDate) };
			}
		}
		
		// Filter by device type if specified
		if (deviceType && deviceType !== 'all') {
			query.deviceType = deviceType;
		}
		
		// Filter by action if specified
		if (action) {
			query.action = action;
		}
		
		// Filter by source (manual, automation, etc.)
		if (source) {
			query.source = source;
		}
			if (from || to) {
				query.createdAt = { /* TODO: Implement */ };
			if (from) query.createdAt.$gte = from;
			if (to) query.createdAt.$lte = to;
			}

			const count = await DeviceHistory.countDocuments(query);
			const response: APIResponse = {
				success: true,
				message: 'Device control count retrieved successfully',
				data: {
					count: count,
					query: query
				},
				timestamp: new Date().toISOString()
			};
			res.json(response);
		} catch (error) {
			console.error('Error getting device control count:', error);
			const response: APIResponse = {
				success: false,
				message: 'Failed to get device control count',
				error: 'Database error occurred',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	}
}
