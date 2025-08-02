import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { voiceCommandService, countService } from '../services';
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
		const {
			dateFrom,
			dateTo,
			from,
			to,
			sortBy = 'timestamp',
			sortOrder = 'desc'
		} = req.query as any;

		const query: any = {};

		// Handle date filters - support both from/to and dateFrom/dateTo
		const fromDate = dateFrom || from;
		const toDate = dateTo || to;

		// Filter by date range if provided
		if (fromDate || toDate) {
			query.timestamp = {};
			if (fromDate) query.timestamp.$gte = new Date(fromDate);
			if (toDate) query.timestamp.$lte = new Date(toDate);
		}

		const skip = (page - 1) * limit;

		// Build sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

		const [commands, total] = await Promise.all([
			VoiceCommand.find(query)
				.sort(sortObj)
				.skip(skip)
				.limit(limit)
				.lean(),
			VoiceCommand.countDocuments(query)
		]);

		const response: APIResponse = {
			success: true,
			data: {
				voiceCommands: commands,
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

/**
 * @route POST /api/voice-commands/process - Process a voice command (for testing)
 * @desc Manually process a voice command for testing purposes
 * @access Public
 */
router.post('/process', asyncHandler(async (req: Request, res: Response) => {
	try {
		const { command, confidence = 1.0 } = req.body;

		if (!command) {
			const response: APIResponse = {
				success: false,
				message: 'Command is required',
				timestamp: new Date().toISOString()
			};
			res.status(400).json(response);
			return;
		}

		// Process the command asynchronously
		voiceCommandService.processVoiceCommand(command, confidence);

		const response: APIResponse = {
			success: true,
			message: 'Voice command queued for processing',
			data: { command, confidence },
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('[VOICE-COMMANDS-PROCESS] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to process voice command',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

/**
 * @route GET /api/voice-commands/count - Get count of voice commands
 * @desc Get total count of voice commands with optional filters
 * @access Public
 */
router.get('/count', asyncHandler(async (req: Request, res: Response) => {
	try {
		const { from, to, processed, minConfidence } = req.query as any;

		const filters = {
			from,
			to,
			processed: processed !== undefined ? processed === 'true' : undefined,
			minConfidence: minConfidence ? parseFloat(minConfidence) : undefined
		};

		const count = await countService.countVoiceCommands(filters);

		const response: APIResponse = {
			success: true,
			message: 'Voice commands count retrieved successfully',
			data: { count },
			timestamp: new Date().toISOString()
		};

		res.json(response);
	} catch (error) {
		console.error('[VOICE-COMMANDS-COUNT] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Failed to get voice commands count',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));

export default router;
