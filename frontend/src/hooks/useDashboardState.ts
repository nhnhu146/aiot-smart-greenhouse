import { useState, useCallback } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAutomationContext } from '@/contexts/AutomationContext';

export interface Activity {
	title: string;
	icon: string;
	device: string;
	description: string;
}

export const useDashboardState = () => {
	const { persistentSensorData, sendDeviceControl, isConnected } = useWebSocketContext();
	const { state: automationState, toggleAutomation } = useAutomationContext();
	const [switchStates, setSwitchStates] = useState(new Map<string, boolean>());
	const [userInteraction, setUserInteraction] = useState(false);

	// Use automation status from shared context
	const autoMode = automationState.automationEnabled;

	const activities: Activity[] = [
		{
			title: 'Lighting System',
			icon: '💡',
			device: 'light',
			description: ''
		},
		{
			title: 'Water Pump',
			icon: '💧',
			device: 'pump',
			description: ''
		},
		{
			title: 'Window Control',
			icon: '🪟',
			device: 'window',
			description: ''
		},
		{
			title: 'Door Access',
			icon: '🚪',
			device: 'door',
			description: ''
		},
	];

	// Handle device toggle for new DeviceControlCenter
	const handleDeviceToggle = useCallback(async (device: string) => {
		const currentState = switchStates.get(device) || false;
		const newState = !currentState;

		setSwitchStates((prev) => new Map(prev).set(device, newState));

		// Map device and state to proper action format
		let action: string;
		if (['light', 'pump'].includes(device)) {
			action = newState ? 'on' : 'off';
		} else if (['door', 'window'].includes(device)) {
			action = newState ? 'open' : 'close';
		} else {
			action = newState ? 'on' : 'off'; // fallback
		}

		await sendDeviceControl(device, action);
		setUserInteraction(true);

		// Clear user interaction flag after 5 minutes to re-enable auto mode
		setTimeout(() => setUserInteraction(false), 5 * 60 * 1000);
	}, [sendDeviceControl, switchStates]);

	const toggleAutoMode = useCallback(async () => {
		await toggleAutomation();
		setUserInteraction(false); // Enable auto control when turning on auto mode
	}, [toggleAutomation]);

	return {
		persistentSensorData,
		isConnected,
		switchStates,
		userInteraction,
		autoMode,
		activities,
		handleDeviceToggle,
		toggleAutoMode,
		setUserInteraction
	};
};
