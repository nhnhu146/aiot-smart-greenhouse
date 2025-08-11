import mongoose from 'mongoose';
import { AppConstants } from '../config/AppConfig';
import { removeDuplicateData } from '../utils/dataUtils';
import { removeDuplicateAlerts } from '../utils/alertUtils';
import { Config } from '../config/AppConfig';
export class DatabaseService {
	private static instance: DatabaseService;
	private isConnected: boolean = false;
	private constructor() {}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	/**
	 * Connect to MongoDB database
	 */
	public async connect(): Promise<void> {
		try {
			if (this.isConnected) {
				console.log('📂 Database already connected');
				return;
			}

			const mongoUri = Config.database.mongoUri;
			console.log('📂 Connecting to MongoDB...');
			await mongoose.connect(mongoUri, {
				serverSelectionTimeoutMS: AppConstants.CONNECTION_TIMEOUT / 2,
				socketTimeoutMS: AppConstants.CONNECTION_TIMEOUT * 4.5,
			});
			this.isConnected = true;
			mongoose.connection.on('connected', () => {
				console.log('✅ Database connected successfully');
			});
			mongoose.connection.on('error', (err) => {
				console.error('❌ Database connection error:', err);
				this.isConnected = false;
			});
			mongoose.connection.on('disconnected', () => {
				console.log('📂 Database disconnected');
				this.isConnected = false;
			});
			// Handle application termination
			process.on('SIGINT', this.gracefulExit);
			process.on('SIGTERM', this.gracefulExit);
		} catch (error) {
			console.error('❌ Failed to connect to database:', error);
			this.isConnected = false;
			throw error;
		}
	}

	/**
	 * Disconnect from MongoDB database
	 */
	public async disconnect(): Promise<void> {
		try {
			if (!this.isConnected) {
				console.log('📂 Database not connected');
				return;
			}

			await mongoose.disconnect();
			this.isConnected = false;
			console.log('📂 Database disconnected successfully');
		} catch (error) {
			console.error('❌ Error disconnecting from database:', error);
			throw error;
		}
	}

	/**
	 * Check if database is connected
	 */
	public isDbConnected(): boolean {
		return this.isConnected && mongoose.connection.readyState === 1;
	}

	/**
	 * Get database connection status
	 */
	public getConnectionStatus(): {
		isConnected: boolean
		readyState: number
		host: string | undefined
		name: string | undefined
	} {
		return {
			isConnected: this.isConnected,
			readyState: mongoose.connection.readyState,
			host: mongoose.connection.host,
			name: mongoose.connection.name,
		};
	}

	/**
	 * Clean up duplicate sensor data (keep most recent)
	 */
	public async cleanDuplicateData(): Promise<void> {
		try {
			console.log('🧹 Starting database cleanup...');
			await removeDuplicateData();
			console.log('✅ Database cleanup completed');
		} catch (error) {
			console.error('❌ Error during database cleanup:', error);
			throw error;
		}
	}

	/**
	 * Clean up duplicate alerts (keep most recent)
	 */
	public async cleanDuplicateAlerts(): Promise<void> {
		try {
			console.log('🧹 Starting alerts cleanup...');
			await removeDuplicateAlerts();
			console.log('✅ Alerts cleanup completed');
		} catch (error) {
			console.error('❌ Error during alerts cleanup:', error);
			throw error;
		}
	}

	/**
	 * Get database statistics
	 */
	public async getDatabaseStats(): Promise<any> {
		try {
			if (!this.isConnected) {
				throw new Error('Database not connected');
			}

			const db = mongoose.connection.db;
			if (!db) {
				throw new Error('Unable to access database');
			}

			// Get collection names and basic stats
			const collections = await db.listCollections().toArray();
			const stats = await db.stats();
			return {
				database: mongoose.connection.name,
				collections: collections.length,
				dataSize: stats.dataSize || 0,
				storageSize: stats.storageSize || 0,
				indexes: stats.indexes || 0,
				indexSize: stats.indexSize || 0,
				documents: stats.objects || 0
			};
		} catch (error) {
			console.error('❌ Error getting database stats:', error);
			// Return basic connection info if stats fail
			return {
				database: mongoose.connection.name || 'unknown',
				collections: 0,
				dataSize: 0,
				storageSize: 0,
				indexes: 0,
				indexSize: 0,
				documents: 0,
				error: 'Failed to retrieve database statistics'
			};
		}
	}

	/**
	 * Graceful exit handler
	 */
	private gracefulExit = async () => {
		try {
			console.log('📂 Gracefully shutting down database connection...');
			await this.disconnect();
			process.exit(0);
		} catch (error) {
			console.error('❌ Error during graceful database shutdown:', error);
			process.exit(1);
		}
	};
}

export const databaseService = DatabaseService.getInstance();