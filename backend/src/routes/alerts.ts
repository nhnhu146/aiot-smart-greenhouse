import { Router } from 'express';
import { validateQuery, validateBody, asyncHandler } from '../middleware';
import { QueryParamsSchema, AlertCreateSchema } from '../schemas';
import { AlertController } from './alerts/AlertController';
import { AlertHandlers } from './alerts/AlertHandlers';

const router = Router();

// GET /api/alerts - Get alerts list
router.get('/', validateQuery(QueryParamsSchema), asyncHandler(AlertController.getAlerts));

// GET /api/alerts/active - Get unresolved alerts
router.get('/active', validateQuery(QueryParamsSchema), asyncHandler(AlertController.getActiveAlerts));

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', asyncHandler(AlertController.getAlertStats));

// POST /api/alerts - Create new alert
router.post('/', validateBody(AlertCreateSchema), asyncHandler(AlertController.createAlert));

// PUT /api/alerts/:id/resolve - Mark alert as resolved
router.put('/:id/resolve', asyncHandler(AlertController.resolveAlert));

// PUT /api/alerts/:id/unresolve - Mark alert as unresolved
router.put('/:id/unresolve', asyncHandler(AlertController.unresolveAlert));

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', asyncHandler(AlertController.deleteAlert));

// POST /api/alerts/resolve-all - Resolve all alerts
router.post('/resolve-all', asyncHandler(AlertController.resolveAllAlerts));

/**
 * @route GET /api/alerts/email/status
 * @desc Get email service status
 * @access Private
 */
router.get('/email/status', asyncHandler(AlertHandlers.getEmailStatus));

/**
 * @route POST /api/alerts/email/test
 * @desc Send test email
 * @access Private
 */
router.post('/email/test', asyncHandler(AlertHandlers.sendTestEmail));

/**
 * @route GET /api/alerts/thresholds
 * @desc Get current alert thresholds
 * @access Private
 */
router.get('/thresholds', asyncHandler(AlertHandlers.getThresholds));

/**
 * @route POST /api/alerts/reload
 * @desc Reload thresholds and email settings from database
 * @access Private
 */
router.post('/reload', asyncHandler(AlertHandlers.reloadSettings));

/**
 * @route POST /api/alerts/system-error
 * @desc Manually trigger system error alert (for testing)
 * @access Private
 */
router.post('/system-error', asyncHandler(AlertHandlers.triggerSystemError));

export default router;
