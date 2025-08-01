import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { voiceCommandService } from '../services';
import { VoiceCommand } from '../models';
import { APIResponse } from '../types';

const router = Router();

/**
 * @route GET /api/voice-commands - Get voice command history
 * @desc Retrieve voice command history with pagination
 * @access Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 50;
		const { from, to } = req.query as any;

		const query: any = {};

		// Filter by date range if provided
		if (from || to) {
			query.timestamp = {};
			if (from) query.timestamp.$gte = new Date(from);
			if (to) query.timestamp.$lte = new Date(to);
		}

		const skip = (page - 1) * limit;

		const [commands, total] = await Promise.all([
			VoiceCommand.find(query)
				.sort({ timestamp: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			VoiceCommand.countDocuments(query)
		]);

		const response: APIResponse = {
			success: true,
			data: {
				commands,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasNext: page < Math.ceil(total / limit),
					hasPrev: page > 1
				}
			},
			message: 'Voice commands retrieved successfully',
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('[VOICE-COMMANDS-GET] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to retrieve voice commands',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

export default router;
