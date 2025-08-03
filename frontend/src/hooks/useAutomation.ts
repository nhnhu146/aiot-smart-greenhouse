// Automation hook - manages frontend automation state from backend API
import { useState, useEffect, useCallback } from 'react';
import automationService from '@/services/automationService';

interface AutomationConfig {
	enabled: boolean;
	lightControl: boolean;
	pumpControl: boolean;
	doorControl: boolean;
	windowControl: boolean;
}

interface AutomationStatus {
	enabled: boolean;
	lastUpdate: string;
	activeControls: {
		light: boolean;
		pump: boolean;
		door: boolean;
		window: boolean;
	};
}

export const useAutomation = () => {
	const [config, setConfig] = useState<AutomationConfig | null>(null);
	const [status, setStatus] = useState<AutomationStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load automation configuration from backend
	const loadConfig = useCallback(async () => {
		try {
			setLoading(true);
			const loadedConfig = await automationService.loadConfiguration();
			if (loadedConfig) {
				setConfig(loadedConfig);
			}
		} catch (err) {
			setError('Failed to load automation config');
		} finally {
			setLoading(false);
		}
	}, []);

	// Load automation status from backend
	const loadStatus = useCallback(async () => {
		try {
			const automationStatus = await automationService.getStatus();
			if (automationStatus) {
				setStatus(automationStatus);
			}
		} catch (err) {
		}
	}, []);

	// Update automation configuration
	const updateConfig = useCallback(async (newConfig: Partial<AutomationConfig>) => {
		if (updating) return false; // Prevent concurrent updates

		try {
			setUpdating(true);
			setError(null);
			const success = await automationService.updateConfiguration(newConfig);
			if (success) {
				await loadConfig(); // Reload to get updated config
				await loadStatus(); // Reload status
				return true;
			}
			return false;
		} catch (err) {
			setError('Failed to update automation config');
			return false;
		} finally {
			setUpdating(false);
		}
	}, [loadConfig, loadStatus, updating]);

	// Toggle automation enabled/disabled
	const toggleAutomation = useCallback(async () => {
		if (!config || updating) return false;

		try {
			setUpdating(true);
			setError(null);
			const success = await automationService.toggleAutomation();
			if (success) {
				await loadConfig(); // Reload to get updated config
				await loadStatus(); // Reload status
				return true;
			}
			return false;
		} catch (err) {
			setError('Failed to toggle automation');
			return false;
		} finally {
			setUpdating(false);
		}
	}, [config, loadConfig, loadStatus, updating]);

	// Trigger immediate automation check
	const triggerImmediateCheck = useCallback(async () => {
		try {
			const success = await automationService.triggerImmediateCheck();
			if (success) {
				await loadStatus(); // Reload status after trigger
			}
			return success;
		} catch (err) {
			return false;
		}
	}, [loadStatus]);

	// Trigger automation for specific sensor
	const triggerSensorAutomation = useCallback(async (sensorType: string, value: number) => {
		try {
			return await automationService.triggerSensorAutomation(sensorType, value);
		} catch (err) {
			console.error(`Error triggering automation for ${sensorType}:`, err);
			return false;
		}
	}, []);

	// Toggle specific device automation
	const toggleDeviceAutomation = useCallback(async (deviceType: keyof Omit<AutomationConfig, 'enabled'>) => {
		if (!config || updating) return false;

		return await updateConfig({ [deviceType]: !config[deviceType] });
	}, [config, updateConfig, updating]);

	// Load initial data
	useEffect(() => {
		loadConfig();
		loadStatus();
	}, [loadConfig, loadStatus]);

	// Removed automatic polling to reduce API calls
	// Status updates now come from WebSocket or manual refresh

	return {
		config,
		status,
		loading,
		updating,
		error,
		loadConfig,
		loadStatus,
		updateConfig,
		toggleAutomation,
		toggleDeviceAutomation,
		triggerImmediateCheck,
		triggerSensorAutomation
	};
};
