import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

export const configureMiddleware = (app: Application): void => {
	// Security middleware
	app.use(helmet({
		crossOriginResourcePolicy: { policy: 'cross-origin' }
	}));

	// CORS configuration
	app.use(cors({
		origin: process.env.CORS_ORIGIN || '*',
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
	}));

	// Special rate limiter for automation status endpoint (more lenient)
	const automationLimiter = rateLimit({
		windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
		max: parseInt(process.env.AUTOMATION_RATE_LIMIT || '900000'), // 600 requests per minute
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
	app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
};
