import apiClient from '../lib/apiClient';

export interface DeviceState {
	status: boolean;
	isOnline: boolean;
	lastCommand: string | null;
	updatedAt: string;
}

export interface DeviceStates {
	[deviceType: string]: DeviceState;
}

class DeviceStateService {
	/**
	 * Get all device states
	 */
	async getAllStates(): Promise<DeviceStates> {
		try {
			const response = await apiClient.get('/devices/states');
			return response.data.data || {};
		} catch (error) {
			console.error('❌ Error fetching device states:', error);
			return {};
		}
	}

	/**
	 * Get specific device state
	 */
	async getDeviceState(deviceType: string): Promise<DeviceState | null> {
		try {
			const response = await apiClient.get(`/devices/states/${deviceType}`);
			return response.data.data || null;
		} catch (error) {
			console.error(`❌ Error fetching ${deviceType} state:`, error);
			return null;
		}
	}

	/**
	 * Update device state
	 */
	async updateDeviceState(
		deviceType: string,
		status: boolean,
		lastCommand?: string
	): Promise<DeviceState | null> {
		try {
			const response = await apiClient.put(`/devices/states/${deviceType}`, {
				status,
				lastCommand
			});
			return response.data.data || null;
		} catch (error) {
			console.error(`❌ Error updating ${deviceType} state:`, error);
			return null;
		}
	}

	/**
	 * Sync all device states via WebSocket
	 */
	async syncAllStates(): Promise<boolean> {
		try {
			await apiClient.post('/devices/states/sync');
			return true;
		} catch (error) {
			console.error('❌ Error syncing device states:', error);
			return false;
		}
	}
}

export const deviceStateService = new DeviceStateService();
export default deviceStateService;
