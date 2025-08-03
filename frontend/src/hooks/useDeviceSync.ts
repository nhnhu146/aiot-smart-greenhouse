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
			console.log('📡 Device state update via WebSocket:', data);
			deviceStateService.handleWebSocketUpdate(data);
		};

		const handleDeviceStatesSync = (data: any) => {
			console.log('📡 Device states sync via WebSocket:', data);
			if (data.states && onStatesSync) {
				onStatesSync(data.states);
			}
		};

		// Listen for various WebSocket events
		socket.on('device:state-update', handleDeviceStateUpdate);
		socket.on('device:states-sync', handleDeviceStatesSync);
		socket.on('device:status', handleDeviceStateUpdate); // Legacy compatibility
		
		// Listen for individual device events
		['light', 'pump', 'door', 'window'].forEach(deviceType => {
			socket.on(`device:${deviceType}:state`, handleDeviceStateUpdate);
		});

		// Listen for device control confirmations
		socket.on('device-control-confirmation', (data: any) => {
			console.log('📡 Device control confirmation:', data);
			if (data.deviceType && data.success) {
				deviceStateService.handleWebSocketUpdate({
					deviceType: data.deviceType,
					status: data.status,
					lastCommand: data.action,
					timestamp: data.timestamp
				});
			}
		});

		return () => {
			socket.off('device:state-update', handleDeviceStateUpdate);
			socket.off('device:states-sync', handleDeviceStatesSync);
			socket.off('device:status', handleDeviceStateUpdate);
			socket.off('device-control-confirmation');
			
			['light', 'pump', 'door', 'window'].forEach(deviceType => {
				socket.off(`device:${deviceType}:state`, handleDeviceStateUpdate);
			});
		};
	}, [socket, onStatesSync]);

	// Subscribe to device state service callbacks
	useEffect(() => {
		const unsubscribeSync = onStatesSync ? 
			deviceStateService.onStateSync(onStatesSync) : 
			() => {};
		
		const unsubscribeUpdate = onStateUpdate ? 
			deviceStateService.onStateUpdate(onStateUpdate) : 
			() => {};

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
