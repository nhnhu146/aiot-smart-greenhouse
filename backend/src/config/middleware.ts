import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Config } from './AppConfig';
import { autoMergeResponseMiddleware } from '../middleware';

export const configureMiddleware = (app: Application): void => {
	// Trust proxy configuration for rate limiter - enable for production deployments
	app.set('trust proxy', Config.app.isProduction ? 1 : false);
	// Security middleware
	app.use(helmet({
		crossOriginResourcePolicy: { policy: 'cross-origin' }
	}));
	// CORS configuration
	app.use(cors({
		origin: Config.cors.origin,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
	}));
	// Special rate limiter for automation status endpoint (more lenient)
	const automationLimiter = rateLimit({
		windowMs: Config.rateLimit.windowMs,
		max: Config.rateLimit.automationLimit,
		message: {
			success: false,
			message: 'Too many automation requests, please try again later',
			timestamp: new Date().toISOString()
		},
		standardHeaders: true,
		legacyHeaders: false
	});
	// Apply special rate limiting to automation endpoints
	app.use('/api/automation', automationLimiter);
	// Body parsing middleware
	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ extended: true, limit: '10mb' }));
	// Compression middleware
	app.use(compression() as any);
	// Logging middleware
	app.use(morgan(Config.app.isProduction ? 'combined' : 'dev'));

	// AutoMerge Response Middleware - Apply before route handlers
	app.use(autoMergeResponseMiddleware);
};