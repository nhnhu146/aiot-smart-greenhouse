import express from 'express';

import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware';
import coreRouter from './userSettings/core';
import alertsRouter from './userSettings/alerts';
import mqttRouter from './userSettings/mqtt';
const router = express.Router();
// Rate limiting for user settings
const settingsLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Reasonable limit: 100 requests per 15 minutes per IP
	message: {
		success: false,
		message: 'Too many settings requests from this IP, please try again later'
	}
});
router.use(settingsLimiter);
router.use(authenticateToken);
// Mount sub-routers
router.use(coreRouter);
router.use(alertsRouter);
router.use(mqttRouter);
export default router;