// Test-friendly app export that bypasses environment validation
import express from 'express';
import { configureMiddleware } from './config/middleware';
import routes from './routes';
import authRoutes from './auth/authRoutes';
import { errorHandler, notFoundHandler } from './middleware';

// Mock environment for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing';

const app = express();
const API_PREFIX = '/api';

// Configure middleware
configureMiddleware(app);

// Auth routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// API routes  
app.use(API_PREFIX, routes);

// Root endpoint
app.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'Test Environment - AIOT Smart Greenhouse Backend API',
		version: '1.0.0',
		timestamp: new Date().toISOString(),
		environment: 'test'
	});
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
