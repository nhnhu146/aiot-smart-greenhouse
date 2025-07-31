// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
import path from 'path';
// Use root .env file only, not from subfolder
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Import services and middleware
import { databaseService, mqttService, alertService, webSocketService, DataMergerService, automationService } from './services';
import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';

// Import models
import { SensorData, Settings, Alert, PasswordReset, UserSettings } from './models';
import { DeviceHistory } from './models';

// User model interface (replaces Firebase Auth)
interface User {
	id: string;
	email: string;
	password: string;
	createdAt: Date;
	lastLogin?: Date;
	lastPasswordReset?: Date;
}

// Password reset token interface
interface PasswordResetToken {
	email: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map();

// Make users globally accessible
global.users = users;

// In-memory password reset tokens store
const passwordResetTokens: Map<string, PasswordResetToken> = new Map();

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

// Proper JWT implementation with signing
const generateToken = (payload: object): string => {
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || '24h'
	} as jwt.SignOptions);
};

const verifyToken = (token: string): any => {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		throw new Error('Invalid or expired token');
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
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'
	]
}));

// Rate limiting
// const limiter = rateLimit({
// 	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '9000000'), // 15 minutes
// 	max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '9000000'), // Increased from 100000 to 1000 (reasonable limit)
// 	message: {
// 		success: false,
// 		message: 'Too many requests from this IP, please try again later',
// 		timestamp: new Date().toISOString()
// 	},
// 	standardHeaders: true,
// 	legacyHeaders: false
// });

// app.use(limiter);

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

		// Trim email to handle whitespace issues
		const trimmedEmail = email.trim();

		const user = users.get(trimmedEmail);
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

		// Trim email to handle whitespace issues
		const trimmedEmail = email.trim();

		if (users.has(trimmedEmail)) {
			res.status(409).json({
				success: false,
				message: 'User already exists'
			});
			return;
		}

		// Hash password before saving
		const hashedPassword = await bcrypt.hash(password, 10);

		const user: User = {
			id: Date.now().toString(),
			email: trimmedEmail,
			password: hashedPassword, // ✅ Password is now properly hashed
			createdAt: new Date()
		};

		users.set(trimmedEmail, user);

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

// Password reset request
app.post(`${API_PREFIX}/auth/password-reset`, async (req: Request, res: Response): Promise<void> => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(400).json({
				success: false,
				message: 'Email is required'
			});
			return;
		}

		// Trim email to handle whitespace issues
		const trimmedEmail = email.trim();

		const user = users.get(trimmedEmail);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		// Generate password reset token
		const token = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

		// Store password reset token
		const passwordResetToken: PasswordResetToken = {
			email: trimmedEmail,
			token,
			expiresAt,
			createdAt: new Date()
		};

		passwordResetTokens.set(token, passwordResetToken);

		// Send password reset email
		const { emailService } = await import('./services');
		const emailSent = await emailService.sendPasswordResetEmail(trimmedEmail, token);

		if (!emailSent) {
			console.warn('Failed to send password reset email, but continuing...');
		}

		res.json({
			success: true,
			message: 'Password reset link has been sent to your email'
		});
	} catch (error) {
		console.error('Password reset request error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Password reset
app.post(`${API_PREFIX}/auth/password-reset/confirm`, async (req: Request, res: Response): Promise<void> => {
	try {
		const { token, newPassword } = req.body;

		if (!token || !newPassword) {
			res.status(400).json({
				success: false,
				message: 'Token and new password are required'
			});
			return;
		}

		const passwordResetToken = passwordResetTokens.get(token);
		if (!passwordResetToken) {
			res.status(400).json({
				success: false,
				message: 'Invalid or expired token'
			});
			return;
		}

		// Check if the token is expired
		if (passwordResetToken.expiresAt < new Date()) {
			res.status(400).json({
				success: false,
				message: 'Token has expired'
			});
			return;
		}

		// Find the user by email
		const user = users.get(passwordResetToken.email);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update the user's password
		user.password = hashedPassword;

		// Remove the used token
		passwordResetTokens.delete(token);

		// Send password reset confirmation email
		const { emailService } = await import('./services');
		await emailService.sendPasswordResetEmail(passwordResetToken.email, 'confirmed');

		res.json({
			success: true,
			message: 'Password has been reset successfully'
		});
	} catch (error) {
		console.error('Password reset error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Sensor data endpoints (replace ThingSpeak)
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

			const messageString = message.toString().trim();
			console.log(`📄 Message content: ${messageString}`);

			// Handle sensor data - IoT devices send only simple numeric values
			if (topic.startsWith('greenhouse/sensors/')) {
				const sensorValue = parseFloat(messageString);

				if (isNaN(sensorValue)) {
					console.error('❌ Invalid sensor value received:', messageString);
					// Send debug feedback for invalid data
					mqttService.publishDebugFeedback(topic, messageString, 'error_invalid_value');
					return;
				}

				// Extract sensor type from topic
				const sensorType = topic.split('/')[2];
				console.log(`🔧 Processing ${sensorType} sensor with value: ${sensorValue}`);

				// Save to database using correct model structure
				await saveSensorDataToDatabase(sensorType, sensorValue);

				// Broadcast sensor data to WebSocket clients with merged data
				await webSocketService.broadcastSensorData(topic, {
					type: sensorType,
					value: sensorValue,
					timestamp: new Date().toISOString(),
					quality: 'good'
				});

				console.log(`📡 Broadcasted ${sensorType} sensor data: ${sensorValue}`);

				// Check alerts
				if (alertService) {
					await checkSensorAlerts(sensorType, sensorValue);
				}

				// Send debug feedback for successful processing
				mqttService.publishDebugFeedback(topic, messageString, 'success');
			}

			// Handle voice commands from greenhouse/command topic
			else if (topic === 'greenhouse/command') {
				console.log(`🎤 Received voice command: ${messageString}`);

				// Import voice command service
				const { voiceCommandService } = await import('./services');

				// Parse command and confidence score
				let command = messageString;
				let confidence: number | null = null; // Start with null for N/A case

				// Check if message contains confidence score (format: commandName;score)
				if (messageString.includes(';')) {
					const parts = messageString.split(';');
					command = parts[0];
					const scoreStr = parts[1];

					// Try to parse confidence score
					const parsedScore = parseFloat(scoreStr.replace(',', '.'));
					if (!isNaN(parsedScore)) {
						confidence = parsedScore;
						console.log(`🎯 Parsed confidence score: ${confidence}`);
					} else {
						console.log(`⚠️ Invalid confidence score format: ${scoreStr}, keeping as N/A`);
					}
				} else {
					console.log(`ℹ️ No confidence score provided, will display as N/A`);
				}

				// Process voice command with parsed confidence (or null for N/A)
				await voiceCommandService.processVoiceCommand(command, confidence);

				// Send debug feedback
				mqttService.publishDebugFeedback(topic, messageString, 'voice_command_processed');
			}

		} catch (error) {
			console.error('❌ Error processing MQTT message:', error);
			// Send debug feedback for processing errors
			mqttService.publishDebugFeedback(topic, message.toString(), 'error_processing');
		}
	});
}

// Helper function to save sensor data to database with pre-merge check
async function saveSensorDataToDatabase(sensorType: string, value: number) {
	try {
		const now = new Date();

		// Prepare new sensor data
		const newData: any = {
			deviceId: 'esp32-greenhouse-01',
			dataQuality: 'partial',
			createdAt: now
		};

		// Map sensor type to database field
		switch (sensorType) {
			case 'temperature':
				newData.temperature = value;
				break;
			case 'humidity':
				newData.humidity = value;
				break;
			case 'soil':
				newData.soilMoisture = value;
				break;
			case 'water':
				newData.waterLevel = value;
				break;
			case 'light':
				newData.lightLevel = value;
				break;
			case 'height':
				newData.plantHeight = value;
				break;
			case 'rain':
				newData.rainStatus = value;
				break;
			case 'motion':
				newData.motionDetected = value;
				break;
			default:
				console.warn(`🔍 Unknown sensor type: ${sensorType}`);
				return;
		}

		// Set processing flag to prevent automation conflicts
		const { automationService } = await import('./services');
		automationService.setDataProcessing(true);

		let finalDoc: any = null;

		try {
			// Use DataMergerService for pre-save merge check
			const dataMergerService = DataMergerService.getInstance();

			// Check if there are duplicates and merge if needed
			const mergedDoc = await dataMergerService.preSaveMergeCheck(newData);

			if (mergedDoc) {
				// Data was merged with existing document
				finalDoc = mergedDoc;
				console.log(`🔄 Merged ${sensorType} sensor data: ${value} (merged with existing record)`);
			} else {
				// No duplicates found, save new document
				const sensorDoc = new SensorData(newData);
				finalDoc = await sensorDoc.save();
				console.log(`💾 Saved ${sensorType} sensor data: ${value} (new record)`);
			}
		} finally {
			// Always clear processing flag FIRST
			automationService.setDataProcessing(false);
		}

		// Process automation AFTER data processing is complete
		if (finalDoc) {
			try {
				await automationService.processSensorData(sensorType, value);
				console.log(`🤖 Automation processed for ${sensorType}: ${value}`);
			} catch (automationError) {
				console.error(`❌ Automation processing error for ${sensorType}:`, automationError);
			}
		}

	} catch (error) {
		console.error(`❌ Error saving sensor data to database:`, error);
	}
}

// Helper function to check sensor alerts
async function checkSensorAlerts(sensorType: string, value: number) {
	try {
		// Create alert data structure expected by AlertService
		const alertData: any = {
			temperature: null,
			humidity: null,
			soilMoisture: null,
			waterLevel: null
		};

		// Set the specific sensor value
		switch (sensorType) {
			case 'temperature':
				alertData.temperature = value;
				break;
			case 'humidity':
				alertData.humidity = value;
				break;
			case 'soil':
				alertData.soilMoisture = value;
				break;
			case 'water':
				alertData.waterLevel = value;
				break;
		}

		// Only check alerts for supported sensor types
		if (['temperature', 'humidity', 'soil', 'water'].includes(sensorType)) {
			await alertService.checkSensorThresholds(alertData);
		}

	} catch (error) {
		console.error(`❌ Error checking sensor alerts:`, error);
	}
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

		// Connect to MQTT broker and wait for connection
		await mqttService.connect();
		console.log('✅ MQTT connection established');

		// Setup MQTT handlers after connection is ready
		setupMQTTHandlers();
		console.log('✅ MQTT handlers setup');

		// Setup graceful shutdown
		setupGracefulShutdown();

		// Create HTTP server
		const httpServer = createServer(app);

		// Initialize WebSocket service
		webSocketService.initialize(httpServer);
		console.log('✅ WebSocket service initialized');

		// Initialize Data Merger Service and start periodic merge
		const dataMergerService = DataMergerService.getInstance();
		await dataMergerService.schedulePeriodicMerge(2); // Every 2 minutes for more aggressive merging
		console.log('✅ Data merger service initialized with 2-minute intervals');

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
