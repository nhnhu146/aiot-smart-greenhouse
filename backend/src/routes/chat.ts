import { Router, Request, Response } from 'express';
import { SensorData } from '../models';
import { asyncHandler } from '../middleware';
import { APIResponse } from '../types';
const router = Router();
/**
 * @route POST /api/chat
 * @desc Simple rule-based chatbot for greenhouse questions
 * @access Public
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
	const { question } = req.body;
	if (!question) {
		const response: APIResponse = {
			success: false,
			message: 'Question is required',
			timestamp: new Date().toISOString()
		};
		res.status(400).json(response);
		return;
	}

	// Simple rule-based chatbot responses
	const lowerQuestion = question.toLowerCase();
	let answer = 'I\'m sorry, I don\'t understand that question. Try asking about temperature, humidity, or soil moisture.';
	try {
		if (lowerQuestion.includes('temperature')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.temperature != null
				? `The current temperature is ${latestData.temperature}°C`
				: 'Temperature data is not available.';
		} else if (lowerQuestion.includes('humidity')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.humidity != null
				? `The current humidity is ${latestData.humidity}%`
				: 'Humidity data is not available.';
		} else if (lowerQuestion.includes('moisture') || lowerQuestion.includes('soil')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.soilMoisture != null
				? `The current soil moisture is ${latestData.soilMoisture}%`
				: 'Soil moisture data is not available.';
		} else if (lowerQuestion.includes('water')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.waterLevel != null
				? `The current water level is ${latestData.waterLevel}`
				: 'Water level data is not available.';
		} else if (lowerQuestion.includes('light')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.lightLevel != null
				? `The current light level is ${latestData.lightLevel}`
				: 'Light level data is not available.';
		} else if (lowerQuestion.includes('help')) {
			answer = 'I can help you with information about:\n- Temperature\n- Humidity\n- Soil moisture\n- Water level\n- Light level\nJust ask me about any of these!';
		}

		const response: APIResponse = {
			success: true,
			message: 'Chat response generated successfully',
			data: {
				question,
				answer
			},
			timestamp: new Date().toISOString()
		};
		res.json(response);
	} catch (error) {
		console.error('[CHAT] Error:', error);
		const response: APIResponse = {
			success: false,
			message: 'Chat service error',
			timestamp: new Date().toISOString()
		};
		res.status(500).json(response);
	}
}));
export default router;