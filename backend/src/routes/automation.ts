import { Router } from 'express';
import { asyncHandler } from '../middleware';
import { AutomationController } from './automation/AutomationController';
import { AutomationHandlers } from './automation/AutomationHandlers';

const router = Router();

/**
 * @route GET /api/automation - Get automation configuration
 * @desc Retrieve current automation settings
 * @access Public
 */
router.get('/', asyncHandler(AutomationController.getConfiguration));

/**
 * @route PUT /api/automation - Update automation configuration
 * @desc Update automation settings
 * @access Public
 */
router.put('/', asyncHandler(AutomationController.updateConfiguration));

/**
 * @route POST /api/automation/toggle - Toggle automation on/off
 * @desc Toggle automation enabled state for frontend compatibility
 * @access Public
 */
router.post('/toggle', asyncHandler(AutomationController.toggleAutomation));

/**
 * @route GET /api/automation/status - Get current automation status
 * @desc Get real-time automation status and last actions
 * @access Public
 */
router.get('/status', asyncHandler(AutomationController.getStatus));

/**
 * @route POST /api/automation/reset - Reset to default settings
 * @desc Reset automation settings to defaults
 * @access Public
 */
router.post('/reset', asyncHandler(AutomationController.resetToDefaults));

/**
 * POST /api/automation/trigger
 * Manually trigger automation check with current sensor values
 */
router.post('/trigger', asyncHandler(AutomationHandlers.triggerCheck));

/**
 * POST /api/automation/sensor-trigger
 * Trigger automation for specific sensor value (from frontend)
 */
router.post('/sensor-trigger', asyncHandler(AutomationHandlers.triggerSensorAutomation));

/**
 * @route POST /api/automation/run-check - Trigger immediate automation check
 * @desc Manually trigger an automation check with current sensor data
 * @access Public
 */
router.post('/run-check', asyncHandler(AutomationHandlers.runImmediateCheck));

export default router;
