import { useState, useCallback } from 'react';
import { AutomationSettings, AutomationMessage } from '@/types/automation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAutomationSettings = () => {
	const [settings, setSettings] = useState<AutomationSettings>({
		automationEnabled: false,
		lightControlEnabled: true,
		pumpControlEnabled: true,
		windowControlEnabled: true,
		lightThresholds: {
			turnOnWhenDark: 0,
			turnOffWhenBright: 1
		},
		pumpThresholds: {
			turnOnWhenDry: 0,
			turnOffWhenWet: 1
		},
		temperatureThresholds: {
			windowOpenTemp: 30,
			windowCloseTemp: 25
		},
		rainSettings: {
			autoCloseWindowOnRain: true,
			autoOpenAfterRain: false
		}
	});

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [resetting, setResetting] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [runningCheck, setRunningCheck] = useState(false);
	const [message, setMessage] = useState<AutomationMessage | null>(null);

	const showMessage = (type: 'success' | 'danger', text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 5000);
	};

	const loadSettings = useCallback(async (showSuccessMessage = true) => {
		const isLoading = showSuccessMessage ? setReloading : setLoading;
		isLoading(true);

		try {
			const response = await fetch(`${API_BASE_URL}/api/automation`);
			const data = await response.json();

			if (data.success && data.data) {
				setSettings(data.data);
				if (showSuccessMessage) {
					showMessage('success', 'Settings reloaded successfully!');
				}
			} else {
				showMessage('danger', data.message || 'Failed to load automation settings');
			}
		} catch (error) {
			console.error('Error loading automation settings:', error);
			showMessage('danger', 'Failed to load automation settings');
		} finally {
			isLoading(false);
		}
	}, []);

	const saveSettings = useCallback(async () => {
		setSaving(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});

			const data = await response.json();

			if (data.success) {
				showMessage('success', 'Settings saved successfully!');
			} else {
				showMessage('danger', data.message || 'Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving settings:', error);
			showMessage('danger', 'Failed to save settings');
		} finally {
			setSaving(false);
		}
	}, [settings]);

	const resetToDefaults = useCallback(async () => {
		setResetting(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation/reset`, {
				method: 'POST'
			});

			const data = await response.json();

			if (data.success) {
				setSettings(data.data);
				showMessage('success', 'Settings reset to defaults!');
			} else {
				showMessage('danger', data.message || 'Failed to reset settings');
			}
		} catch (error) {
			console.error('Error resetting settings:', error);
			showMessage('danger', 'Failed to reset settings');
		} finally {
			setResetting(false);
		}
	}, []);

	const runAutomationCheck = useCallback(async () => {
		setRunningCheck(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation/run-check`, {
				method: 'POST'
			});

			const data = await response.json();

			if (data.success) {
				showMessage('success', 'Automation check completed successfully!');
			} else {
				showMessage('danger', data.message || 'Failed to run automation check');
			}
		} catch (error) {
			console.error('Error running automation check:', error);
			showMessage('danger', 'Failed to run automation check');
		} finally {
			setRunningCheck(false);
		}
	}, []);

	const handleInputChange = (field: string, value: any, parentField?: string) => {
		setSettings(prev => {
			if (parentField) {
				const parent = prev[parentField as keyof AutomationSettings] as any;
				return {
					...prev,
					[parentField]: {
						...parent,
						[field]: value
					}
				};
			}
			return { ...prev, [field]: value };
		});
	};

	return {
		settings,
		setSettings,
		loading,
		saving,
		resetting,
		reloading,
		runningCheck,
		message,
		showMessage,
		loadSettings,
		saveSettings,
		resetToDefaults,
		runAutomationCheck,
		handleInputChange
	};
};
