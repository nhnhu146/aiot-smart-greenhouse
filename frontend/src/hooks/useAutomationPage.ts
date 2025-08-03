import { useEffect } from 'react';
import { useAutomation } from '@/hooks/useAutomation';
import { useAutomationSettings } from '@/hooks/useAutomationSettings';
import { useAutomationContext } from '@/contexts/AutomationContext';

export const useAutomationPage = () => {
	const { updating: hookUpdating } = useAutomation();
	const { state: automationState, toggleAutomation } = useAutomationContext();
	const {
		settings,
		setSettings,
		loading,
		saving,
		resetting,
		reloading,
		runningCheck,
		message,
		hasUnsavedChanges,
		loadSettings,
		saveSettings,
		resetToDefaults,
		runAutomationCheck,
		handleInputChange
	} = useAutomationSettings();

	// Check if any action is in progress
	const isAnyActionInProgress = loading || saving || resetting || reloading || hookUpdating || runningCheck;

	// Use automation status from shared context (synced with Dashboard)
	const autoMode = automationState.automationEnabled;

	const handleAutomationToggle = async () => {
		if (isAnyActionInProgress) return;
		const success = await toggleAutomation();
		if (success) {
			// Update local settings to match
			setSettings(prev => ({ ...prev, automationEnabled: !autoMode }));
		}
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
		hasUnsavedChanges,
		isAnyActionInProgress,
		handleAutomationToggle,
		handleInputChange,
		saveSettings,
		loadSettings: () => loadSettings(true),
		resetToDefaults,
		runAutomationCheck
	};
};
