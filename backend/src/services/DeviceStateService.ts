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

			await DeviceStatus.findOneAndUpdate(
				{ deviceType },
				updateData,
				{ upsert: true, new: true }
			);

			// Broadcast device state update via WebSocket
			webSocketService.broadcastDeviceStatus(`greenhouse/devices/${deviceType}/status`, {
				device: deviceType,
				status: status ? 'on' : 'off',
				timestamp: new Date().toISOString()
			});

			console.log(`📊 Device state updated: ${deviceType} -> ${status ? 'ON' : 'OFF'}`);

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
}

export const deviceStateService = new DeviceStateService();
