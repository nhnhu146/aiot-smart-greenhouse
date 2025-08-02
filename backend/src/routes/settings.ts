import { Router } from 'express';
import { asyncHandler } from '../middleware';
import { SettingsHandlers } from './settings/SettingsHandlers';

/**
 * Settings Routes - Clean route configuration using modular handlers
 * Main file focused only on route definitions and middleware setup
 */

const router = Router();

// Main settings routes
router.get('/', asyncHandler(SettingsHandlers.getSettings));
router.post('/', asyncHandler(SettingsHandlers.saveCompleteSettings));

// Threshold management
router.post('/thresholds', asyncHandler(SettingsHandlers.updateThresholds));

// Email configuration
router.post('/email-recipients', asyncHandler(SettingsHandlers.updateEmailRecipients));
router.post('/email-alerts', asyncHandler(SettingsHandlers.updateEmailAlerts));
router.post('/test-email', asyncHandler(SettingsHandlers.testEmail));
router.get('/email-status', asyncHandler(SettingsHandlers.getEmailStatus));

// Alert frequency settings
router.post('/alert-frequency', asyncHandler(SettingsHandlers.updateAlertFrequency));

// Reset functionality
router.post('/reset', asyncHandler(SettingsHandlers.resetToDefaults));

export default router;
