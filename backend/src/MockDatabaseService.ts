// Mock DatabaseService for tests - bypasses real MongoDB connection
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
		console.log('🧪 [Test] Mock database connection established');
		this.isConnected = true;
		return Promise.resolve();
	}

	public async disconnect(): Promise<void> {
		console.log('🧪 [Test] Mock database disconnected');
		this.isConnected = false;
		return Promise.resolve();
	}

	public isDbConnected(): boolean {
		return this.isConnected;
	}

	public getConnectionStatus() {
		return {
			isConnected: this.isConnected,
			readyState: this.isConnected ? 1 : 0,
			host: 'localhost-mock',
			name: 'test-db'
		};
	}

	public async cleanDuplicateData(): Promise<void> {
		return Promise.resolve();
	}

	public async cleanDuplicateAlerts(): Promise<void> {
		return Promise.resolve();
	}

	public async getDatabaseStats(): Promise<any> {
		return Promise.resolve({
			database: 'test-db',
			collections: 0,
			dataSize: 0,
			storageSize: 0,
			indexes: 0,
			indexSize: 0,
			documents: 0
		});
	}

	private gracefulExit = async (): Promise<void> => {
		await this.disconnect();
		process.exit(0);
	};
}

export const databaseService = DatabaseService.getInstance();
