// Mock models for tests - bypasses real MongoDB models
/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockModel {
	static async find(_query = {}) {
		console.log('🧪 [Test] Mock model find called');
		return [];
	}

	static async findOne(_query = {}) {
		console.log('🧪 [Test] Mock model findOne called');
		return null;
	}

	static async create(data: any) {
		console.log('🧪 [Test] Mock model create called');
		return { _id: 'mock-id', ...data };
	}

	static async updateOne(_query: any, _update: any) {
		console.log('🧪 [Test] Mock model updateOne called');
		return { modifiedCount: 1 };
	}

	static async deleteMany(_query = {}) {
		console.log('🧪 [Test] Mock model deleteMany called');
		return { deletedCount: 0 };
	}

	static async countDocuments(_query = {}) {
		console.log('🧪 [Test] Mock model countDocuments called');
		return 0;
	}

	async save() {
		console.log('🧪 [Test] Mock model save called');
		return this;
	}
}

// Export all model mocks
export const SensorData = MockModel;
export const DeviceStatus = MockModel;
export const DeviceHistory = MockModel;
export const Settings = MockModel;
export const Alert = MockModel;
export const PasswordReset = MockModel;
export const UserSettings = MockModel;
export const AutomationSettings = MockModel;
export const VoiceCommand = MockModel;

// Export types (empty for tests)
export interface ISensorData { }
export interface IDeviceStatus { }
export interface IDeviceHistory { }
export interface ISettings { }
export interface IAlert { }
export interface IUserSettings { }
export interface IPasswordReset { }
export interface IAutomationSettings { }
export interface IVoiceCommand { }
