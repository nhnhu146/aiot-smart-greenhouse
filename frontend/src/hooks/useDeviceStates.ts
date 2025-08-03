import { useState, useEffect } from 'react';
import { deviceStateService, DeviceStates, DeviceStateUpdate } from '@/services/deviceStateService';

export const useDeviceStates = () => {
	const [deviceStates, setDeviceStates] = useState<DeviceStates>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isSubscribed = true;

		// Subscribe to state changes
		const unsubscribeSync = deviceStateService.onStateSync((states) => {
			if (isSubscribed) {
				setDeviceStates(states);
				setIsLoading(false);
				setError(null);
			}
		});

		const unsubscribeUpdate = deviceStateService.onStateUpdate((update: DeviceStateUpdate) => {
			if (isSubscribed) {
				setDeviceStates(prev => ({
					...prev,
					[update.deviceType]: {
						status: update.status,
						isOnline: update.isOnline,
						lastCommand: update.lastCommand,
						updatedAt: update.updatedAt
					}
				}));
			}
		});

		// Initialize device states
		const initializeStates = async () => {
			try {
				setIsLoading(true);
				await deviceStateService.initialize();
			} catch (err) {
				if (isSubscribed) {
					setError(err instanceof Error ? err.message : 'Failed to load device states');
					setIsLoading(false);
				}
			}
		};

		initializeStates();

		// Cleanup function
		return () => {
			isSubscribed = false;
			unsubscribeSync();
			unsubscribeUpdate();
		};
	}, []);

	const updateDeviceState = async (deviceType: string, status: boolean, lastCommand?: string) => {
		try {
			setError(null);
			return await deviceStateService.updateDeviceState(deviceType, status, lastCommand);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update device state');
			return null;
		}
	};

	const refreshStates = async () => {
		try {
			setError(null);
			return await deviceStateService.forceRefresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to refresh device states');
			return {};
		}
	};

	const clearCache = () => {
		deviceStateService.clearCache();
		setDeviceStates({});
	};

	return {
		deviceStates,
		isLoading,
		error,
		updateDeviceState,
		refreshStates,
		clearCache
	};
};
