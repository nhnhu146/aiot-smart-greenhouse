import { DeviceStatus, DeviceHistory } from '../models';
import { webSocketService } from './WebSocketService';
export class DeviceStateService {

	async updateDeviceState(
		deviceType: string,
		status: boolean,
		lastCommand?: string,
		source: 'manual' | 'automation' = 'manual',
		userId?: string,
		triggeredBy?: string,
		sensorValue?: number
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
			// Save to device history based on source
			await this.saveDeviceHistory(deviceType, status, lastCommand || (status ? 'on' : 'off'), source, userId, triggeredBy, sensorValue);
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
			console.log(`📊 Device state updated and broadcasted: ${deviceType} -> ${status ? 'ON' : 'OFF'} (${source})`);
		} catch (error) {
			console.error(`❌ Error updating device state for ${deviceType}:`, error);
		}
	}

	/**
	 * Save device control to history
	 */
	private async saveDeviceHistory(
		deviceType: string,
		status: boolean,
		action: string,
		source: 'manual' | 'automation',
		userId?: string,
		triggeredBy?: string,
		sensorValue?: number
	): Promise<void> {
		try {
			const historyData = {
				deviceId: `greenhouse_${deviceType}`,
				deviceType: deviceType as 'light' | 'pump' | 'door' | 'window',
				action: action as 'on' | 'off' | 'open' | 'close',
				status,
				controlType: source,
				triggeredBy,
				userId,
				sensorValue,
				timestamp: new Date(),
				success: true
			};
			// Save to database
			const deviceHistory = new DeviceHistory(historyData);
			await deviceHistory.save();
			// Broadcast via WebSocket based on source
			if (source === 'automation') {
				webSocketService.broadcastAutomationHistory({
					deviceType,
					action,
					status,
					triggeredBy: triggeredBy || 'automation',
					sensorValue: sensorValue || 0,
					timestamp: new Date().toISOString()
				});
			} else {
				webSocketService.broadcastManualHistory({
					deviceType,
					action,
					status,
					userId: userId || 'manual-user',
					timestamp: new Date().toISOString()
				});
			}

			console.log(`📝 Device history saved: ${deviceType} ${action} (${source})`);
		} catch (error) {
			console.error('❌ Error saving device history:', error);
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
			return await DeviceStatus.find({}).sort({ updatedAt: -1 });
		} catch (error) {
			console.error('❌ Error fetching all device states:', error);
			return [];
		}
	}

	async syncAllDeviceStates(): Promise<void> {
		try {
			const allStates = await DeviceStatus.find({ /* TODO: Implement */ });
			const statesMap: any = { /* TODO: Implement */ };
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