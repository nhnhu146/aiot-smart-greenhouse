import { createServer, Server } from 'http';
import { Application } from 'express';
import { databaseService, mqttService, webSocketService, DataMergerService } from '../services';
import { MQTTHandler } from '../handlers/mqttHandler';
import { createDefaultAdmin } from '../auth/authService';

export class StartupService {
	static async initializeServices(): Promise<void> {
		try {
			console.log('🚀 Starting AIOT Smart Greenhouse Backend...');

			// Initialize default admin user
			await createDefaultAdmin();

			// Connect to database
			console.log('🔌 Connecting to MongoDB...');
			await databaseService.connect();
			console.log('✅ Database connected');

			// Connect to MQTT broker and wait for connection
			console.log('📡 Starting MQTT service...');
			await mqttService.connect();
			console.log('✅ MQTT connection established');

			// Setup MQTT handlers after connection is ready
			MQTTHandler.setup();
			console.log('✅ MQTT handlers setup');

			console.log('✅ All services initialized successfully');

		} catch (error) {
			console.error('❌ Service initialization failed:', error);
			throw error;
		}
	}

	static async startServer(app: Application, port: number): Promise<Server> {
		try {
			// Create HTTP server
			const server = createServer(app);

			// Initialize WebSocket service
			console.log('🔄 Initializing WebSocket service...');
			webSocketService.initialize(server);
			console.log('✅ WebSocket service initialized');

			// Initialize Data Merger Service 
			console.log('🔀 Starting data merger service...');
			const dataMergerService = DataMergerService.getInstance();
			console.log('✅ Data merger service initialized');

			// Start Express server
			return new Promise((resolve, reject) => {
				const httpServer = server.listen(port, () => {
					console.log(`🌟 Server running on port ${port}`);
					console.log(`🔗 API endpoint: http://localhost:${port}${process.env.API_PREFIX || '/api'}`);
					console.log(`📚 Health check: http://localhost:${port}${process.env.API_PREFIX || '/api'}/health`);
					console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
					console.log(`👤 Default Admin User: admin/admin`);
					resolve(httpServer);
				});

				httpServer.on('error', (error) => {
					console.error('❌ Failed to start server:', error);
					reject(error);
				});
			});

		} catch (error) {
			console.error('❌ Failed to start server:', error);
			throw error;
		}
	}

	static setupGracefulShutdown(): void {
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
}
