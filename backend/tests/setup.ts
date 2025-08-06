import { jest } from '@jest/globals';

// Mock all models before any tests run
jest.mock('../src/models', () => {
	class MockQuery {
		lean() {
			console.log('🧪 [Setup] Mock query lean called');
			return Promise.resolve([]);
		}
	}

	class MockModel {
		static find(query = {}) {
			console.log('🧪 [Setup] Mock model find called');
			return new MockQuery();
		}

		static findOne(query = {}) {
			console.log('🧪 [Setup] Mock model findOne called');
			// Return object with lean method for chaining
			return {
				lean: () => Promise.resolve(null)
			};
		}

		static async create(data: any) {
			console.log('🧪 [Setup] Mock model create called');
			return { _id: 'mock-id', ...data };
		}

		static async updateOne(query: any, update: any) {
			console.log('🧪 [Setup] Mock model updateOne called');
			return { modifiedCount: 1 };
		}

		static async deleteMany(query = {}) {
			console.log('🧪 [Setup] Mock model deleteMany called');
			return { deletedCount: 0 };
		}

		static async countDocuments(query = {}) {
			console.log('🧪 [Setup] Mock model countDocuments called');
			return 0;
		}

		async save() {
			console.log('🧪 [Setup] Mock model save called');
			return this;
		}
	}

	return {
		SensorData: MockModel,
		DeviceStatus: MockModel,
		DeviceHistory: MockModel,
		Settings: MockModel,
		Alert: MockModel,
		PasswordReset: MockModel,
		UserSettings: MockModel,
		AutomationSettings: MockModel,
		VoiceCommand: MockModel,
	};
});

// Global test setup
beforeAll(async () => {
	// Setup test database connection
	// Initialize test environment
});

afterAll(async () => {
	// Cleanup test database
	// Close connections
});

// Mock console methods to reduce noise in tests
// global.console = {
// 	...console,
// 	log: jest.fn(),
// 	debug: jest.fn(),
// 	info: jest.fn(),
// 	warn: jest.fn(),
// 	error: jest.fn(),
// };
