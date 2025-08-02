import { useEffect } from 'react';
import { useAutomation } from '@/hooks/useAutomation';
import { useAutomationSettings } from '@/hooks/useAutomationSettings';

export const useAutomationPage = () => {
	const { config: automationConfig, toggleAutomation, updating: hookUpdating } = useAutomation();
	const {
		settings,
		setSettings,
		loading,
		saving,
		resetting,
		reloading,
		runningCheck,
		message,
		loadSettings,
		saveSettings,
		resetToDefaults,
		runAutomationCheck,
		handleInputChange
	} = useAutomationSettings();

	// Check if any action is in progress
	const isAnyActionInProgress = loading || saving || resetting || reloading || hookUpdating || runningCheck;

	// Sync main automation toggle with the shared hook
	const autoMode = automationConfig?.enabled ?? false;

	const handleAutomationToggle = async () => {
		if (isAnyActionInProgress) return;
		const newState = !autoMode;
		await toggleAutomation();
		setSettings(prev => ({ ...prev, automationEnabled: newState }));
	};

	// Load settings on component mount
	useEffect(() => {
		loadSettings(false); // Don't show success message on initial load
	}, [loadSettings]);

	return {
		settings,
		loading,
		saving,
		resetting,
		reloading,
		runningCheck,
		message,
		autoMode,
		isAnyActionInProgress,
		handleAutomationToggle,
		handleInputChange,
		saveSettings,
		loadSettings: () => loadSettings(true),
		resetToDefaults,
		runAutomationCheck
	};
};
