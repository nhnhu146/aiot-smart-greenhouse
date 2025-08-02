// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
import path from 'path';
// Use root .env file only, not from subfolder
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Import middleware and routes
import { errorHandler, notFoundHandler } from './middleware';
import { configureMiddleware } from './config/middleware';
import routes from './routes';
import authRoutes from './auth/authRoutes';
import { StartupService } from './services/StartupService';

// Import services and models for integrated endpoints
import { SensorData, Settings } from './models';
import { users, passwordResetTokens, generateToken } from './auth/authService';

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

// Additional sensor data endpoints (integrated from service.backup)
app.get(`${API_PREFIX}/sensors/latest`, async (req: Request, res: Response) => {
	try {
		const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
		res.json(latestData || {});
	} catch (error) {
		console.error('Error fetching latest sensor data:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch sensor data' });
	}
});

app.get(`${API_PREFIX}/sensors/history`, async (req: Request, res: Response) => {
	try {
		const limit = parseInt(req.query.limit as string) || 100;
		const history = await SensorData.find({})
			.sort({ createdAt: -1 })
			.limit(limit);
		res.json(history);
	} catch (error) {
		console.error('Error fetching sensor history:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch sensor history' });
	}
});

app.post(`${API_PREFIX}/sensors`, async (req: Request, res: Response) => {
	try {
		const sensorData = new SensorData(req.body);
		const saved = await sensorData.save();
		res.json({ success: true, id: saved._id, message: 'Sensor data saved' });
	} catch (error) {
		console.error('Error saving sensor data:', error);
		res.status(500).json({ success: false, message: 'Failed to save sensor data' });
	}
});

// Settings endpoints (integrated from service.backup)
app.get(`${API_PREFIX}/settings`, async (req: Request, res: Response) => {
	try {
		const settings = await Settings.findOne({}) || {};
		res.json({ success: true, data: settings });
	} catch (error) {
		console.error('Error fetching settings:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch settings' });
	}
});

app.post(`${API_PREFIX}/settings`, async (req: Request, res: Response) => {
	try {
		await Settings.findOneAndUpdate({}, req.body, { upsert: true });
		res.json({ success: true, message: 'Settings saved successfully' });
	} catch (error) {
		console.error('Error saving settings:', error);
		res.status(500).json({ success: false, message: 'Failed to save settings' });
	}
});

// Chat endpoint (integrated from service.backup)
app.post(`${API_PREFIX}/chat`, async (req: Request, res: Response): Promise<void> => {
	try {
		const { question } = req.body;

		if (!question) {
			res.status(400).json({ success: false, message: 'Question is required' });
			return;
		}

		// Simple rule-based chatbot (replace with your preferred AI service)
		const lowerQuestion = question.toLowerCase();
		let answer = "I'm sorry, I don't understand that question.";

		if (lowerQuestion.includes('temperature')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.temperature != null
				? `The current temperature is ${latestData.temperature}°C`
				: "Temperature data is not available.";
		} else if (lowerQuestion.includes('humidity')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.humidity != null
				? `The current humidity is ${latestData.humidity}%`
				: "Humidity data is not available.";
		} else if (lowerQuestion.includes('moisture')) {
			const latestData = await SensorData.findOne({}).sort({ createdAt: -1 });
			answer = latestData && latestData.soilMoisture != null
				? `The current soil moisture is ${latestData.soilMoisture}%`
				: "Soil moisture data is not available.";
		}

		res.json({
			success: true,
			question,
			answer,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Chat error:', error);
		res.status(500).json({ success: false, message: 'Chat service error' });
	}
});

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
