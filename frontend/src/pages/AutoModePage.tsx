import { useState, useEffect, useCallback } from 'react';
import { useAutomation } from '@/hooks/useAutomation';
import { AutomationSettings, AutomationMessage } from '@/types/automation';
import AutomationHeader from '@/components/AutoMode/AutomationHeader';
import AutomationMessageDisplay from '@/components/AutoMode/AutomationMessageDisplay';
import ControlToggleCard from '@/components/AutoMode/ControlToggleCard';
import LightThresholdCard from '@/components/AutoMode/LightThresholdCard';
import PumpThresholdCard from '@/components/AutoMode/PumpThresholdCard';
import TemperatureThresholdCard from '@/components/AutoMode/TemperatureThresholdCard';
import RainSettingsCard from '@/components/AutoMode/RainSettingsCard';
import AutomationActions from '@/components/AutoMode/AutomationActions';
import './AutoModePage.css';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AutoModePage = () => {
	const { config: automationConfig, toggleAutomation, updating: hookUpdating } = useAutomation();

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

	// Check if any action is in progress
	const isAnyActionInProgress = loading || saving || resetting || reloading || hookUpdating || runningCheck;

	// Sync main automation toggle with the shared hook
	const autoMode = automationConfig?.enabled ?? false;

	const showMessage = (type: 'success' | 'danger', text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 5000);
	};

	const loadSettings = useCallback(async () => {
		if (isAnyActionInProgress) return; // Prevent multiple concurrent actions

		setReloading(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation`);
			const data = await response.json();

			if (data.success && data.data) {
				setSettings(data.data);
				showMessage('success', 'Settings reloaded successfully!');
			} else {
				showMessage('danger', data.message || 'Failed to load automation settings');
			}
		} catch (error) {
			console.error('Error loading automation settings:', error);
			showMessage('danger', 'Failed to load automation settings');
		} finally {
			setReloading(false);
		}
	}, [isAnyActionInProgress]);

	// Initial load function (no success message)
	const initialLoadSettings = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation`);
			const data = await response.json();

			if (data.success && data.data) {
				setSettings(data.data);
			} else {
				showMessage('danger', data.message || 'Failed to load automation settings');
			}
		} catch (error) {
			console.error('Error loading automation settings:', error);
			showMessage('danger', 'Failed to load automation settings');
		} finally {
			setLoading(false);
		}
	}, []);

	// Load settings on component mount
	useEffect(() => {
		initialLoadSettings();
	}, [initialLoadSettings]);

	const saveSettings = async () => {
		if (isAnyActionInProgress) return; // Prevent multiple concurrent actions

		setSaving(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(settings),
			});

			const data = await response.json();

			if (data.success) {
				setSettings(data.data);
				showMessage('success', 'Automation settings saved successfully!');
			} else {
				showMessage('danger', data.message || 'Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving automation settings:', error);
			showMessage('danger', 'Failed to save automation settings');
		} finally {
			setSaving(false);
		}
	};

	const resetToDefaults = async () => {
		if (isAnyActionInProgress) return; // Prevent multiple concurrent actions

		setResetting(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation/reset`, {
				method: 'POST',
			});

			const data = await response.json();

			if (data.success) {
				setSettings(data.data);
				showMessage('success', 'Settings reset to defaults successfully!');
			} else {
				showMessage('danger', data.message || 'Failed to reset settings');
			}
		} catch (error) {
			console.error('Error resetting automation settings:', error);
			showMessage('danger', 'Failed to reset automation settings');
		} finally {
			setResetting(false);
		}
	};

	const runAutomationCheck = async () => {
		if (isAnyActionInProgress) return;

		setRunningCheck(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation/run-check`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			if (!response.ok) {
				throw new Error('Failed to run automation check');
			}

			const result = await response.json();
			if (result.success) {
				showMessage('success', 'Automation check completed successfully');
			} else {
				showMessage('danger', result.message || 'Failed to run automation check');
			}
		} catch (error) {
			console.error('Failed to run automation check:', error);
			showMessage('danger', 'Failed to run automation check');
		} finally {
			setRunningCheck(false);
		}
	};

	const handleAutomationToggle = async () => {
		if (isAnyActionInProgress) return;
		const newState = !autoMode;
		await toggleAutomation();
		setSettings(prev => ({ ...prev, automationEnabled: newState }));
	};

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

	if (loading) {
		return (
			<div className="automode-loading">
				<div>Loading automation settings...</div>
			</div>
		);
	}

	return (
		<div className="automode-container">
			<AutomationHeader
				autoMode={autoMode}
				isAnyActionInProgress={isAnyActionInProgress}
				onToggle={handleAutomationToggle}
			/>

			<AutomationMessageDisplay message={message} />

			<div className="settings-grid">
				<ControlToggleCard
					settings={settings}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<LightThresholdCard
					lightThresholds={settings.lightThresholds}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<PumpThresholdCard
					pumpThresholds={settings.pumpThresholds}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<TemperatureThresholdCard
					temperatureThresholds={settings.temperatureThresholds}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<RainSettingsCard
					rainSettings={settings.rainSettings}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>
			</div>

			<AutomationActions
				isAnyActionInProgress={isAnyActionInProgress}
				saving={saving}
				reloading={reloading}
				runningCheck={runningCheck}
				resetting={resetting}
				onSave={saveSettings}
				onReload={loadSettings}
				onRunCheck={runAutomationCheck}
				onReset={resetToDefaults}
			/>
		</div>
	);
};

export default AutoModePage;
