import mongoose from 'mongoose';

export class DatabaseService {
	private static instance: DatabaseService;
	private isConnected: boolean = false;

	private constructor() { }

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	public async connect(): Promise<void> {
		if (this.isConnected) {
			console.log('🔗 Database already connected');
			return;
		}

		try {
			const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiot_greenhouse';

			await mongoose.connect(mongoUri, {
				retryWrites: true,
				w: 'majority',
			});

			this.isConnected = true;
			console.log('✅ Connected to MongoDB successfully');

			// Handle connection events
			mongoose.connection.on('error', (error) => {
				console.error('❌ MongoDB connection error:', error);
				this.isConnected = false;
			});

			mongoose.connection.on('disconnected', () => {
				console.log('⚠️ MongoDB disconnected');
				this.isConnected = false;
			});

			mongoose.connection.on('reconnected', () => {
				console.log('🔄 MongoDB reconnected');
				this.isConnected = true;
			});

		} catch (error) {
			console.error('❌ Failed to connect to MongoDB:', error);
			this.isConnected = false;
			throw error;
		}
	}

	public async disconnect(): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		try {
			await mongoose.disconnect();
			this.isConnected = false;
			console.log('🔌 Disconnected from MongoDB');
		} catch (error) {
			console.error('❌ Error disconnecting from MongoDB:', error);
			throw error;
		}
	}

	public isConnectionActive(): boolean {
		return this.isConnected && mongoose.connection.readyState === 1;
	}

	public async healthCheck(): Promise<{ status: string; message: string }> {
		try {
			if (!this.isConnectionActive()) {
				return {
					status: 'error',
					message: 'Database connection is not active'
				};
			}

			// Ping the database
			await mongoose.connection.db?.admin().ping();

			return {
				status: 'healthy',
				message: 'Database connection is healthy'
			};
		} catch (error) {
			return {
				status: 'error',
				message: `Database health check failed: ${error}`
			};
		}
	}
}

export const databaseService = DatabaseService.getInstance();
