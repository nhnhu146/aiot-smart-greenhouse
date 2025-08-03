import { DeviceStatus } from '../models';
import { webSocketService } from './WebSocketService';

export class DeviceStateService {

	async updateDeviceState(
		deviceType: string,
		status: boolean,
		lastCommand?: string
	): Promise<void> {
		try {
			const updateData = {
				deviceType,
				status,
				isOnline: true,
				lastCommand: lastCommand || (status ? 'on' : 'off'),
				updatedAt: new Date()
			};

			const updatedState = await DeviceStatus.findOneAndUpdate(
				{ deviceType },
				updateData,
				{ upsert: true, new: true }
			);

			// Enhanced WebSocket broadcasting
			webSocketService.broadcastDeviceStatus(`greenhouse/devices/${deviceType}/status`, {
				device: deviceType,
				status: status ? 'on' : 'off',
				timestamp: new Date().toISOString()
			});

			// Broadcast individual device state update
			webSocketService.broadcastDeviceStateUpdate(deviceType, {
				status,
				isOnline: true,
				lastCommand: updateData.lastCommand,
				updatedAt: updateData.updatedAt
			});

			// Broadcast database change
			webSocketService.broadcastDatabaseChange('DeviceStatus', 'update', {
				deviceType,
				previousState: null, // Could store previous state if needed
				newState: updateData
			});

			console.log(`📊 Device state updated and broadcasted: ${deviceType} -> ${status ? 'ON' : 'OFF'}`);

		} catch (error) {
			console.error(`❌ Error updating device state for ${deviceType}:`, error);
		}
	}

	async getDeviceState(deviceType: string): Promise<any | null> {
		try {
			return await DeviceStatus.findOne({ deviceType });
		} catch (error) {
			console.error(`❌ Error fetching device state for ${deviceType}:`, error);
			return null;
		}
	}

	async getAllDeviceStates(): Promise<any[]> {
		try {
			return await DeviceStatus.find({});
		} catch (error) {
			console.error('❌ Error fetching all device states:', error);
			return [];
		}
	}

	async syncAllDeviceStates(): Promise<void> {
		try {
			const allStates = await DeviceStatus.find({});
			const statesMap: any = {};

			allStates.forEach(device => {
				statesMap[device.deviceType] = {
					status: device.status,
					isOnline: device.isOnline,
					lastCommand: device.lastCommand,
					updatedAt: device.updatedAt
				};
			});

			// Broadcast complete state sync using the new method
			webSocketService.broadcastDeviceStateSync(statesMap);

			console.log('📡 All device states synchronized via WebSocket');
		} catch (error) {
			console.error('❌ Error syncing all device states:', error);
		}
	}
}

export const deviceStateService = new DeviceStateService();
