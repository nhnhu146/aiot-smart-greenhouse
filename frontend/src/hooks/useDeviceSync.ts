import { useEffect, useCallback } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { deviceStateService, DeviceStates, DeviceStateUpdate } from '@/services/deviceStateService';

interface UseDeviceSyncProps {
	onStatesSync?: (states: DeviceStates) => void;
	onStateUpdate?: (update: DeviceStateUpdate) => void;
	autoSync?: boolean; // Auto-sync on connection
}

export const useDeviceSync = ({
	onStatesSync,
	onStateUpdate,
	autoSync = true
}: UseDeviceSyncProps = {}) => {
	const { socket, isConnected } = useWebSocketContext();

	// Handle WebSocket device state updates
	useEffect(() => {
		if (!socket) return;

		const handleDeviceStateUpdate = (data: any) => {
			deviceStateService.handleWebSocketUpdate(data);
		};

		const handleDeviceStatesSync = (data: any) => {
			if (data.states && onStatesSync) {
				onStatesSync(data.states);
			}
		};

		// Listen for various WebSocket events - standardized naming
		socket.on('device:state:update', handleDeviceStateUpdate);
		socket.on('device:state:sync', handleDeviceStatesSync);
		socket.on('device:status', handleDeviceStateUpdate); // Legacy compatibility

		// Listen for individual device events
		['light', 'pump', 'door', 'window'].forEach(deviceType => {
			socket.on(`device:${deviceType}:state`, handleDeviceStateUpdate);
		});

		// Listen for device control confirmations
		socket.on('device:control', (data: any) => {
			if (data.data && data.data.deviceType && data.data.success) {
				deviceStateService.handleWebSocketUpdate({
					deviceType: data.data.deviceType,
					status: data.data.status,
					lastCommand: data.data.action,
					timestamp: data.timestamp
				});
			}
		});

		return () => {
			socket.off('device:state:update', handleDeviceStateUpdate);
			socket.off('device:state:sync', handleDeviceStatesSync);
			socket.off('device:status', handleDeviceStateUpdate);
			socket.off('device:control');

			['light', 'pump', 'door', 'window'].forEach(deviceType => {
				socket.off(`device:${deviceType}:state`, handleDeviceStateUpdate);
			});
		};
	}, [socket, onStatesSync]);

	// Subscribe to device state service callbacks
	useEffect(() => {
		const unsubscribeSync = onStatesSync ?
			deviceStateService.onStateSync(onStatesSync) :
			() => { };

		const unsubscribeUpdate = onStateUpdate ?
			deviceStateService.onStateUpdate(onStateUpdate) :
			() => { };

		return () => {
			unsubscribeSync();
			unsubscribeUpdate();
		};
	}, [onStatesSync, onStateUpdate]);

	// Auto-sync when connection is established
	useEffect(() => {
		if (isConnected && autoSync) {
			const timer = setTimeout(() => {
				deviceStateService.syncAllStates();
			}, 1000); // Wait 1 second after connection

			return () => clearTimeout(timer);
		}
	}, [isConnected, autoSync]);

	// Manual sync function
	const syncStates = useCallback(async () => {
		return await deviceStateService.syncAllStates();
	}, []);

	// Force refresh function
	const forceRefresh = useCallback(async () => {
		return await deviceStateService.forceRefresh();
	}, []);

	return {
		syncStates,
		forceRefresh,
		isConnected
	};
};

export default useDeviceSync;
