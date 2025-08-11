import { Router } from 'express';
import { AlertMonitoringHandlers } from './AlertMonitoringHandlers';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// All monitoring endpoints require authentication
router.use(authenticateToken);

/**
 * @route GET /api/alerts/monitoring/status
 * @desc Get alert system status
 * @access Private
 */
router.get('/status', AlertMonitoringHandlers.getSystemStatus);

/**
 * @route GET /api/alerts/monitoring/health
 * @desc Perform comprehensive health check
 * @access Private
 */
router.get('/health', AlertMonitoringHandlers.performHealthCheck);

/**
 * @route POST /api/alerts/monitoring/test-email
 * @desc Test email notification system
 * @access Private
 */
router.post('/test-email', AlertMonitoringHandlers.testEmailSystem);

/**
 * @route POST /api/alerts/monitoring/test-alerts
 * @desc Test alert checking system
 * @access Private
 */
router.post('/test-alerts', AlertMonitoringHandlers.testAlertChecking);

export default router;
