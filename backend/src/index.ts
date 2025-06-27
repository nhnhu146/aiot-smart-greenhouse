// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';

// Import services and middleware
import { databaseService, mqttService, alertService, webSocketService } from './services';
import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';

// Import models
import { SensorData, Settings, Alert } from './models';

// User model interface (replaces Firebase Auth)
interface User {
	id: string;
	email: string;
	password: string;
	createdAt: Date;
	lastLogin?: Date;
}

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map();

// Create default admin user with hashed password
const createDefaultAdmin = async () => {
	const hashedPassword = await bcrypt.hash('admin', 10);
	const defaultAdmin: User = {
		id: 'admin-001',
		email: 'admin@gmail.com',
		password: hashedPassword,
		createdAt: new Date(),
		lastLogin: undefined
	};

	// Add default admin to users store
	users.set('admin@gmail.com', defaultAdmin);
	console.log('✅ Default admin user created: admin@gmail.com/admin');
};

// Initialize default admin
createDefaultAdmin();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple authentication without external libraries
const generateToken = (payload: any): string => {
	return Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64');
};

const verifyToken = (token: string): any => {
	try {
		const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
		if (decoded.exp < Date.now()) {
			throw new Error('Token expired');
		}
		return decoded;
	} catch (error) {
		throw new Error('Invalid token');
	}
};

// Authentication middleware
const authenticateToken = (req: any, res: Response, next: NextFunction): void => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ success: false, message: 'Access token required' });
		return;
	}

	try {
		const user = verifyToken(token);
		req.user = user;
		next();
	} catch (error) {
		res.status(403).json({ success: false, message: 'Invalid or expired token' });
		return;
	}
};

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Security middleware
app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
	origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'
	]
}));

// Rate limiting
const limiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
	max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
	message: {
		success: false,
		message: 'Too many requests from this IP, please try again later',
		timestamp: new Date().toISOString()
	},
	standardHeaders: true,
	legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware (type assertion to fix TypeScript issue)
app.use(compression() as any);

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// API routes
app.use(API_PREFIX, routes);

// Authentication routes (replace Firebase Auth)
app.post(`${API_PREFIX}/auth/signin`, async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({
				success: false,
				message: 'Email and password are required'
			});
			return;
		}

		const user = users.get(email);
		if (!user) {
			res.status(401).json({
				success: false,
				message: 'Invalid email or password'
			});
			return;
		}

		// Use bcrypt to compare password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			res.status(401).json({
				success: false,
				message: 'Invalid email or password'
			});
			return;
		}

		// Update last login
		user.lastLogin = new Date();

		const token = generateToken({ id: user.id, email: user.email });

		res.json({
			success: true,
			user: { id: user.id, email: user.email },
			token,
			message: 'Sign in successful'
		});
	} catch (error) {
		console.error('Sign in error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

app.post(`${API_PREFIX}/auth/signup`, async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({
				success: false,
				message: 'Email and password are required'
			});
			return;
		}

		if (users.has(email)) {
			res.status(409).json({
				success: false,
				message: 'User already exists'
			});
			return;
		}

		const user: User = {
			id: Date.now().toString(),
			email,
			password, // In production, use bcrypt.hash(password, 10)
			createdAt: new Date()
		};

		users.set(email, user);

		const token = generateToken({ id: user.id, email: user.email });

		res.json({
			success: true,
			user: { id: user.id, email: user.email },
			token,
			message: 'Account created successfully'
		});
	} catch (error) {
		console.error('Sign up error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Sensor data endpoints (replace ThingSpeak)
app.get(`${API_PREFIX}/sensors/latest`, async (req: Request, res: Response) => {
	try {
		const latestData = await SensorData.findOne({}).sort({ timestamp: -1 });
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
			.sort({ timestamp: -1 })
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

// Settings endpoints
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

// Chat endpoint (replace Hugging Face API)
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
			const latestData = await SensorData.findOne({}).sort({ timestamp: -1 });
			answer = latestData
				? `The current temperature is ${latestData.temperature}°C`
				: "Temperature data is not available.";
		} else if (lowerQuestion.includes('humidity')) {
			const latestData = await SensorData.findOne({}).sort({ timestamp: -1 });
			answer = latestData
				? `The current humidity is ${latestData.humidity}%`
				: "Humidity data is not available.";
		} else if (lowerQuestion.includes('moisture')) {
			const latestData = await SensorData.findOne({}).sort({ timestamp: -1 });
			answer = latestData
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

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// MQTT message handler
function setupMQTTHandlers() {
	// Inject AlertService into MQTTService to avoid circular dependency
	mqttService.setAlertService(alertService);

	mqttService.onMessage(async (topic: string, message: Buffer) => {
		try {
			console.log(`📨 Received MQTT message on topic: ${topic}`);

			const messageString = message.toString();
			console.log(`📄 Message content: ${messageString}`);

			// Handle sensor data
			if (topic.startsWith('greenhouse/sensors/')) {
				const sensorValue = parseFloat(messageString);

				if (isNaN(sensorValue)) {
					console.error('❌ Invalid sensor value received:', messageString);
					return;
				}

				// Process sensor data through the new system
				await mqttService.processSensorData(topic, sensorValue);

				// Broadcast sensor data to WebSocket clients
				webSocketService.broadcastSensorData(topic, { value: sensorValue });
			}

		} catch (error) {
			console.error('❌ Error processing MQTT message:', error);
		}
	});
}

// Graceful shutdown
function setupGracefulShutdown() {
	const shutdown = async (signal: string) => {
		console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

		try {
			// Close MQTT connection
			mqttService.disconnect();
			console.log('✅ MQTT connection closed');

			// Close database connection
			await databaseService.disconnect();
			console.log('✅ Database connection closed');

			console.log('✅ Graceful shutdown completed');
			process.exit(0);
		} catch (error) {
			console.error('❌ Error during graceful shutdown:', error);
			process.exit(1);
		}
	};

	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server
async function startServer() {
	try {
		console.log('🚀 Starting AIOT Smart Greenhouse Backend...');

		// Connect to database
		await databaseService.connect();
		console.log('✅ Database connected');

		// Setup MQTT handlers
		setupMQTTHandlers();
		console.log('✅ MQTT handlers setup');

		// Setup graceful shutdown
		setupGracefulShutdown();

		// Create HTTP server
		const httpServer = createServer(app);

		// Initialize WebSocket service
		webSocketService.initialize(httpServer);
		console.log('✅ WebSocket service initialized');

		// Start Express server
		const server = httpServer.listen(PORT, () => {
			console.log(`🌟 Server running on port ${PORT}`);
			console.log(`🔗 API endpoint: http://localhost:${PORT}${API_PREFIX}`);
			console.log(`📚 Health check: http://localhost:${PORT}${API_PREFIX}/health`);
			console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
			console.log(`👤 Default Admin User: admin/admin`);
		});

		return server;
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
}

// Start the server if this file is run directly
if (require.main === module) {
	startServer();
}

export default app;
