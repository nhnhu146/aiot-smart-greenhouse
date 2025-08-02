import { Request, Response } from 'express';
import { z } from 'zod';
import { APIResponse } from '../../types';
import { SensorTriggerSchema } from './AutomationValidation';
import { automationService } from '../../services';

export class AutomationHandlers {
	/**
	 * Manually trigger automation check with current sensor values
	 */
	static async triggerCheck(req: Request, res: Response) {
		try {
			console.log('[AUTOMATION-TRIGGER] Manual automation trigger requested');

			// Trigger immediate automation check with current sensor values
			await automationService.processImmediateAutomationCheck();

			const response: APIResponse = {
				success: true,
				message: 'Automation check triggered successfully',
				data: {
					triggered: true,
					timestamp: new Date().toISOString()
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error('[AUTOMATION-TRIGGER] Error:', error);
			const response: APIResponse = {
				success: false,
				message: 'Failed to trigger automation check',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	}

	/**
	 * Trigger automation for specific sensor value
	 */
	static async triggerSensorAutomation(req: Request, res: Response) {
		try {
			const { sensorType, value } = SensorTriggerSchema.parse(req.body);

			console.log(`[AUTOMATION-SENSOR-TRIGGER] Triggering automation for ${sensorType}: ${value}`);

			// Process automation for the specific sensor
			await automationService.processSensorData(sensorType, value);

			const response: APIResponse = {
				success: true,
				message: `Automation triggered for ${sensorType}`,
				data: {
					sensorType,
					value,
					timestamp: new Date().toISOString()
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error('[AUTOMATION-SENSOR-TRIGGER] Error:', error);
			const response: APIResponse = {
				success: false,
				message: error instanceof z.ZodError ? 'Invalid sensor trigger data' : 'Failed to trigger sensor automation',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	}

	/**
	 * Trigger immediate automation check
	 */
	static async runImmediateCheck(req: Request, res: Response) {
		try {
			const { automationService } = await import('../../services');

			// Get current automation status
			const automationStatus = automationService.getAutomationStatus();

			if (!automationStatus.enabled) {
				const response: APIResponse = {
					success: false,
					message: 'Automation is currently disabled',
					timestamp: new Date().toISOString()
				};
				res.status(400).json(response);
				return;
			}

			// Trigger immediate automation check
			await automationService.processImmediateAutomationCheck();

			const response: APIResponse = {
				success: true,
				message: 'Automation check triggered successfully',
				data: {
					automationStatus: automationStatus,
					timestamp: new Date().toISOString()
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error('[AUTOMATION-RUN-CHECK] Error:', error);
			const response: APIResponse = {
				success: false,
				message: 'Failed to run automation check',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	}
}
