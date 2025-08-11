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

export class DeviceStateService {
	private syncCallbacks: ((states: DeviceStates) => void)[] = [];
	private updateCallbacks: ((update: DeviceStateUpdate) => void)[] = [];
	private readonly STORAGE_KEY = 'aiot_device_states';

	/**
	 * Load device states from localStorage
	 */
	private loadFromStorage(): DeviceStates {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			return stored ? JSON.parse(stored) : {};
		} catch (error) {
      console.error('Device service error:', error);
						return {};
		}
	}

	/**
	 * Save device states to localStorage
	 */
	private saveToStorage(states: DeviceStates): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
		} catch {
			// Silently ignore localStorage errors
		}
	}

	/**
	 * Subscribe to device state changes
	 */
	onStateSync(callback: (states: DeviceStates) => void): () => void {
		this.syncCallbacks.push(callback);

		// Immediately send cached states if available
		const cached = this.loadFromStorage();
		if (Object.keys(cached).length > 0) {
			setTimeout(() => callback(cached), 0);
		}

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
		// Save to storage for persistence
		this.saveToStorage(states);

		this.syncCallbacks.forEach(callback => {
			try {
				callback(states);
			} catch {
			// Silently ignore localStorage errors
		}
		});
	}

	/**
	 * Notify subscribers of state update
	 */
	notifyStateUpdate(update: DeviceStateUpdate) {
		// Update storage with individual device update
		const cached = this.loadFromStorage();
		cached[update.deviceType] = {
			status: update.status,
			isOnline: update.isOnline,
			lastCommand: update.lastCommand,
			updatedAt: update.updatedAt
		};
		this.saveToStorage(cached);

		this.updateCallbacks.forEach(callback => {
			try {
				callback(update);
			} catch {
			// Silently ignore localStorage errors
		}
		});
	}

	/**
	 * Get all device states with real-time sync and localStorage fallback
	 */
	async getAllStates(): Promise<DeviceStates> {
		try {
			// First check localStorage for immediate response
			const cached = this.loadFromStorage();

			// If we have cached data, notify immediately
			if (Object.keys(cached).length > 0) {
				this.notifyStateSync(cached);
			}

			// Then fetch from API for fresh data
			const response = await apiClient.get('/api/devices/states');
			const freshStates = response.data.data || {};

			// Merge with cached data (API takes precedence)
			const mergedStates = { ...cached, ...freshStates };

			// Notify subscribers with fresh data
			this.notifyStateSync(mergedStates);

			return mergedStates;
		} catch (error) {
      console.error('Device service error:', error);
						// Return cached data on API failure
			const cached = this.loadFromStorage();
			if (Object.keys(cached).length > 0) {
				this.notifyStateSync(cached);
			}
			return cached;
		}
	}

	/**
	 * Get specific device state
	 */
	async getDeviceState(deviceType: string): Promise<DeviceState | null> {
		try {
			// Check cache first
			const cached = this.loadFromStorage();
			if (cached[deviceType]) {
				return cached[deviceType];
			}

			// Fetch from API
			const response = await apiClient.get(`/api/devices/states/${deviceType}`);
			return response.data.data || null;
		} catch (error) {
      console.error('Device service error:', error);

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
			const response = await apiClient.put(`/api/devices/states/${deviceType}`, {
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
      console.error('Device service error:', error);

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
			await apiClient.post('/api/devices/states/sync');

			// Fetch updated states after sync
			await this.getAllStates();

			return true;
		} catch (error) {
      console.error('Device service error:', error);
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
		return await this.getAllStates();
	}

	/**
	 * Initialize device states on app startup
	 */
	async initialize(): Promise<DeviceStates> {
		return await this.getAllStates();
	}

	/**
	 * Clear cached device states
	 */
	clearCache(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
		} catch {
			// Silently ignore localStorage errors
		}
	}
}

export const deviceStateService = new DeviceStateService();
export default deviceStateService;
