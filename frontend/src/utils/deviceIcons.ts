/**
 * Device Icon Mapping - Consistent device representation across frontend
 * Used in Dashboard, History, and DeviceControl components
 */

export interface DeviceInfo {
	icon: string;
	name: string;
	description: string;
}

export const DEVICE_ICONS: Record<string, DeviceInfo> = {
	light: {
		icon: '💡',
		name: 'Lighting System',
		description: 'LED grow lights for plant photosynthesis'
	},
	pump: {
		icon: '💧',
		name: 'Water Pump',
		description: 'Automated irrigation system'
	},
	door: {
		icon: '🚪',
		name: 'Door Access',
		description: 'Greenhouse entrance door control'
	},
	window: {
		icon: '🪟',
		name: 'Window Control',
		description: 'Ventilation window management'
	}
};

/**
 * Get device icon by device type
 */
export const getDeviceIcon = (deviceType: string): string => {
	return DEVICE_ICONS[deviceType]?.icon || '❓';
};

/**
 * Get device info by device type
 */
export const getDeviceInfo = (deviceType: string): DeviceInfo => {
	return DEVICE_ICONS[deviceType] || {
		icon: '❓',
		name: deviceType,
		description: 'Unknown device'
	};
};

/**
 * Get all device types
 */
export const getAllDeviceTypes = (): string[] => {
	return Object.keys(DEVICE_ICONS);
};

/**
 * Get status emoji for device state
 */
export const getStatusEmoji = (isOn: boolean): string => {
	return isOn ? '🟢' : '🔴';
};

/**
 * Get action display text
 */
export const getActionDisplay = (action: string): string => {
	const actionMap: Record<string, string> = {
		'on': 'Turn On',
		'off': 'Turn Off',
		'open': 'Open',
		'close': 'Close'
	};
	return actionMap[action] || action;
};

export default {
	DEVICE_ICONS,
	getDeviceIcon,
	getDeviceInfo,
	getAllDeviceTypes,
	getStatusEmoji,
	getActionDisplay
};
