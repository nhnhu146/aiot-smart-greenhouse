// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
import path from 'path';
// Use root .env file only, not from subfolder
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';

// Import middleware and routes
import { errorHandler, notFoundHandler } from './middleware';
import { configureMiddleware } from './config/middleware';
import routes from './routes';
import authRoutes from './auth/authRoutes';
import { StartupService } from './services/StartupService';

// Create Express app
const app: Application = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const API_PREFIX = process.env.API_PREFIX || '/api';

// Configure middleware
configureMiddleware(app);

// Auth routes (no prefix needed, already has /api in main routes)
app.use(`${API_PREFIX}/auth`, authRoutes);

// API routes
app.use(API_PREFIX, routes);

// Root endpoint
app.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'AIOT Smart Greenhouse Backend API',
		version: '1.0.0',
		timestamp: new Date().toISOString(),
		endpoints: {
			health: `${API_PREFIX}/health`,
			sensors: `${API_PREFIX}/sensors`,
			devices: `${API_PREFIX}/devices`,
			history: `${API_PREFIX}/history`,
			settings: `${API_PREFIX}/settings`,
			alerts: `${API_PREFIX}/alerts`
		}
	});
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server function
const startServer = async (): Promise<void> => {
	try {
		// Initialize all services
		await StartupService.initializeServices();

		// Start the HTTP server
		await StartupService.startServer(app, PORT);

		// Setup graceful shutdown
		StartupService.setupGracefulShutdown();

	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
};

// Start the application if this file is run directly
if (require.main === module) {
	startServer();
}

export default app;
