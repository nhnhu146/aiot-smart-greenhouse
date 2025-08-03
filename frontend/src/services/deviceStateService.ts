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

export interface DeviceStateUpdate {
	deviceType: string;
	status: boolean;
	isOnline: boolean;
	lastCommand: string | null;
	updatedAt: string;
	timestamp: string;
}

class DeviceStateService {
	private syncCallbacks: ((states: DeviceStates) => void)[] = [];
	private updateCallbacks: ((update: DeviceStateUpdate) => void)[] = [];

	/**
	 * Subscribe to device state changes
	 */
	onStateSync(callback: (states: DeviceStates) => void): () => void {
		this.syncCallbacks.push(callback);
		return () => {
			const index = this.syncCallbacks.indexOf(callback);
			if (index > -1) {
				this.syncCallbacks.splice(index, 1);
			}
		};
	}

	/**
	 * Subscribe to individual device state updates
	 */
	onStateUpdate(callback: (update: DeviceStateUpdate) => void): () => void {
		this.updateCallbacks.push(callback);
		return () => {
			const index = this.updateCallbacks.indexOf(callback);
			if (index > -1) {
				this.updateCallbacks.splice(index, 1);
			}
		};
	}

	/**
	 * Notify subscribers of state sync
	 */
	notifyStateSync(states: DeviceStates) {
		this.syncCallbacks.forEach(callback => {
			try {
				callback(states);
			} catch (error) {
				console.error('Error in state sync callback:', error);
			}
		});
	}

	/**
	 * Notify subscribers of state update
	 */
	notifyStateUpdate(update: DeviceStateUpdate) {
		this.updateCallbacks.forEach(callback => {
			try {
				callback(update);
			} catch (error) {
				console.error('Error in state update callback:', error);
			}
		});
	}

	/**
	 * Get all device states with real-time sync
	 */
	async getAllStates(): Promise<DeviceStates> {
		try {
			const response = await apiClient.get('/devices/states');
			const states = response.data.data || {};
			
			// Notify subscribers
			this.notifyStateSync(states);
			
			return states;
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
	 * Update device state with optimistic updates and rollback on failure
	 */
	async updateDeviceState(
		deviceType: string,
		status: boolean,
		lastCommand?: string
	): Promise<DeviceState | null> {
		try {
			// Create optimistic update
			const optimisticUpdate: DeviceStateUpdate = {
				deviceType,
				status,
				isOnline: true,
				lastCommand: lastCommand || (status ? 'on' : 'off'),
				updatedAt: new Date().toISOString(),
				timestamp: new Date().toISOString()
			};

			// Notify optimistic update
			this.notifyStateUpdate(optimisticUpdate);

			// Send to backend
			const response = await apiClient.put(`/devices/states/${deviceType}`, {
				status,
				lastCommand
			});

			const actualState = response.data.data;
			
			// Notify actual update
			if (actualState) {
				this.notifyStateUpdate({
					deviceType,
					...actualState,
					timestamp: new Date().toISOString()
				});
			}

			return actualState || null;
		} catch (error) {
			console.error(`❌ Error updating ${deviceType} state:`, error);
			
			// Rollback optimistic update by fetching current state
			const currentState = await this.getDeviceState(deviceType);
			if (currentState) {
				this.notifyStateUpdate({
					deviceType,
					...currentState,
					timestamp: new Date().toISOString()
				});
			}
			
			return null;
		}
	}

	/**
	 * Sync all device states via WebSocket
	 */
	async syncAllStates(): Promise<boolean> {
		try {
			await apiClient.post('/devices/states/sync');
			
			// Fetch updated states after sync
			await this.getAllStates();
			
			return true;
		} catch (error) {
			console.error('❌ Error syncing device states:', error);
			return false;
		}
	}

	/**
	 * Handle WebSocket device state update
	 */
	handleWebSocketUpdate(data: any) {
		const update: DeviceStateUpdate = {
			deviceType: data.deviceType || data.device,
			status: data.status === true || data.status === 'on',
			isOnline: data.isOnline ?? true,
			lastCommand: data.lastCommand || data.action,
			updatedAt: data.updatedAt || data.timestamp,
			timestamp: data.timestamp || new Date().toISOString()
		};

		this.notifyStateUpdate(update);
	}

	/**
	 * Force refresh all device states from backend
	 */
	async forceRefresh(): Promise<DeviceStates> {
		console.log('🔄 Force refreshing device states...');
		return await this.getAllStates();
	}
}

export const deviceStateService = new DeviceStateService();
export default deviceStateService;
