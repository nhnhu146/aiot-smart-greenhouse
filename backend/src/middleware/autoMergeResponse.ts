import { Request, Response, NextFunction } from 'express';
import { DataMergerService } from '../services/DataMergerService';
import { SensorData } from '../models';

interface MergeableRoute {
	path: string;
	methods: string[];
	shouldMerge: (req: Request) => boolean;
}

// Routes that should trigger auto-merge before response
const MERGEABLE_ROUTES: MergeableRoute[] = [
	{
		path: '/api/data',
		methods: ['GET'],
		shouldMerge: (req) => true
	},
	{
		path: '/api/data/latest',
		methods: ['GET'],
		shouldMerge: (req) => true
	},
	{
		path: '/api/history/sensors',
		methods: ['GET'],
		shouldMerge: (req) => true
	},
	{
		path: '/api/history/charts',
		methods: ['GET'],
		shouldMerge: (req) => true
	}
];

interface ResponseData {
	success: boolean;
	data?: {
		sensors?: any[];
		[key: string]: any;
	};
	[key: string]: any;
}

/**
 * AutoMerge Response Middleware
 * Automatically merges duplicate sensor data before returning API responses
 */
export const autoMergeResponseMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Check if current route should trigger auto-merge
		const shouldMerge = MERGEABLE_ROUTES.some(route => {
			const pathMatches = req.path.startsWith(route.path);
			const methodMatches = route.methods.includes(req.method.toUpperCase());
			return pathMatches && methodMatches && route.shouldMerge(req);
		});

		if (!shouldMerge) {
			return next();
		}

		console.log(`🔄 AutoMerge middleware triggered for ${req.method} ${req.path}`);

		// Override res.json to intercept the response
		const originalJson = res.json;

		res.json = function (data: ResponseData) {
			// Perform auto-merge before sending response
			performAutoMergeAndSend.call(this, data, originalJson);
			return this;
		};

		next();

	} catch (error) {
		console.error('❌ Error in autoMergeResponseMiddleware:', error);
		next();
	}
};

/**
 * Perform auto-merge and send response
 */
async function performAutoMergeAndSend(this: Response, data: ResponseData, originalJson: Function) {
	try {
		const mergerService = DataMergerService.getInstance();

		// Quick duplicate check first to avoid unnecessary merging
		const hasDuplicates = await quickDuplicateCheck();

		if (hasDuplicates) {
			console.log('🔄 Duplicates detected, performing auto-merge before response...');

			// Perform merge
			const mergeStats = await mergerService.mergeSameTimestampData({
				exactDuplicatesOnly: true,
				timeWindowMs: 60000, // 1 minute window
				preserveOriginal: false
			});

			console.log('✅ Auto-merge completed before response:', {
				merged: mergeStats.mergedRecords,
				deleted: mergeStats.deletedRecords,
				groups: mergeStats.processedGroups
			});

			// If response contains sensor data, refresh it with merged data
			if (data?.data?.sensors) {
				const refreshedData = await refreshSensorData();
				if (refreshedData) {
					data.data.sensors = refreshedData;
					// Add merge metadata to response
					data.merged = true;
					data.mergeStats = {
						mergedRecords: mergeStats.mergedRecords,
						deletedRecords: mergeStats.deletedRecords,
						timestamp: new Date().toISOString()
					};
				}
			}
		}

		// Send the response (merged or original)
		originalJson.call(this, data);

	} catch (error) {
		console.error('❌ Error during auto-merge response:', error);
		// Send original response on error
		originalJson.call(this, data);
	}
}

/**
 * Quick check for duplicates to avoid unnecessary processing
 */
async function quickDuplicateCheck(): Promise<boolean> {
	try {
		const duplicateCount = await SensorData.aggregate([
			{
				$group: {
					_id: '$createdAt',
					count: { $sum: 1 }
				}
			},
			{
				$match: { count: { $gt: 1 } }
			},
			{
				$limit: 1
			}
		]);

		return duplicateCount.length > 0;
	} catch (error) {
		console.error('❌ Error in quick duplicate check:', error);
		return false;
	}
}

/**
 * Refresh sensor data after merge
 */
async function refreshSensorData(): Promise<any[] | null> {
	try {
		const refreshedData = await SensorData.find()
			.sort({ createdAt: -1 })
			.limit(100)
			.lean();

		return refreshedData;
	} catch (error) {
		console.error('❌ Error refreshing sensor data:', error);
		return null;
	}
}

/**
 * Utility function to add specific routes for auto-merge
 */
export const addMergeableRoute = (path: string, methods: string[], condition?: (req: Request) => boolean) => {
	MERGEABLE_ROUTES.push({
		path,
		methods,
		shouldMerge: condition || (() => true)
	});
};

/**
 * Enable/disable auto-merge for specific request patterns
 */
export const shouldAutoMerge = (req: Request): boolean => {
	// Skip auto-merge for high-frequency requests
	if (req.headers['x-skip-merge'] === 'true') {
		return false;
	}

	// Skip for real-time WebSocket data
	if (req.path.includes('/realtime') || req.path.includes('/live')) {
		return false;
	}

	// Skip for manual merge requests
	if (req.path.includes('/merge')) {
		return false;
	}

	return true;
};
