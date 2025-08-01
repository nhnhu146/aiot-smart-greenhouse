import { useState, useEffect, useCallback } from 'react';
import { useAutomation } from '@/hooks/useAutomation';
import './AutoModePage.css';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface LightThresholds {
	turnOnWhenDark: number;
	turnOffWhenBright: number;
}

interface PumpThresholds {
	turnOnWhenDry: number;
	turnOffWhenWet: number;
}

interface TemperatureThresholds {
	windowOpenTemp: number;
	windowCloseTemp: number;
	doorOpenTemp: number;
	doorCloseTemp: number;
}

interface RainSettings {
	autoCloseWindowOnRain: boolean;
	autoOpenAfterRain: boolean;
}

interface WaterLevelSettings {
	autoTurnOffPumpOnFlood: boolean;
	autoOpenDoorOnFlood: boolean;
}

interface AutomationSettings {
	_id?: string;
	automationEnabled: boolean;
	lightControlEnabled: boolean;
	pumpControlEnabled: boolean;
	doorControlEnabled: boolean;
	windowControlEnabled: boolean;
	lightThresholds: LightThresholds;
	pumpThresholds: PumpThresholds;
	temperatureThresholds: TemperatureThresholds;
	rainSettings: RainSettings;
	waterLevelSettings: WaterLevelSettings;
	createdAt?: string;
	updatedAt?: string;
}

const AutoModePage = () => {
	const { config: automationConfig, toggleAutomation, updating: hookUpdating } = useAutomation();

	const [settings, setSettings] = useState<AutomationSettings>({
		automationEnabled: false,
		lightControlEnabled: true,
		pumpControlEnabled: true,
		doorControlEnabled: false,
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
			windowCloseTemp: 25,
			doorOpenTemp: 35,
			doorCloseTemp: 30
		},
		rainSettings: {
			autoCloseWindowOnRain: true,
			autoOpenAfterRain: false
		},
		waterLevelSettings: {
			autoTurnOffPumpOnFlood: true,
			autoOpenDoorOnFlood: true
		}
	});

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [resetting, setResetting] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [runningCheck, setRunningCheck] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

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
			<div className="automode-header">
				<h1>Automation Settings</h1>
				<div className="main-toggle">
					<label className="switch">
						<input
							type="checkbox"
							checked={autoMode}
							onChange={handleAutomationToggle}
							disabled={isAnyActionInProgress}
						/>
						<span className="slider round"></span>
					</label>
					<span className={`status-text ${autoMode ? 'enabled' : 'disabled'}`}>
						{autoMode ? '🤖 Automation Enabled' : '⏹️ Automation Disabled'}
					</span>
				</div>
			</div>

			{message && (
				<div className={`message ${message.type}`}>
					{message.text}
				</div>
			)}

			<div className="settings-grid">
				{/* Device Control Toggles */}
				<div className="settings-card">
					<h3>Device Control</h3>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.lightControlEnabled}
								onChange={(e) => handleInputChange('lightControlEnabled', e.target.checked)}
								disabled={isAnyActionInProgress}
							/>
							💡 Light Control
						</label>
					</div>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.pumpControlEnabled}
								onChange={(e) => handleInputChange('pumpControlEnabled', e.target.checked)}
								disabled={isAnyActionInProgress}
							/>
							💧 Pump Control
						</label>
					</div>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.windowControlEnabled}
								onChange={(e) => handleInputChange('windowControlEnabled', e.target.checked)}
								disabled={isAnyActionInProgress}
							/>
							🪟 Window Control
						</label>
					</div>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.doorControlEnabled}
								onChange={(e) => handleInputChange('doorControlEnabled', e.target.checked)}
								disabled={isAnyActionInProgress}
							/>
							🚪 Door Control
						</label>
					</div>
				</div>

				{/* Light Thresholds */}
				<div className="settings-card">
					<h3>💡 Light Thresholds</h3>

					<div className="input-group">
						<label>Turn on when dark (0-1):</label>
						<input
							type="number"
							min="0"
							max="1"
							step="0.1"
							value={settings.lightThresholds.turnOnWhenDark}
							onChange={(e) => handleInputChange('turnOnWhenDark', parseFloat(e.target.value), 'lightThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>

					<div className="input-group">
						<label>Turn off when bright (0-1):</label>
						<input
							type="number"
							min="0"
							max="1"
							step="0.1"
							value={settings.lightThresholds.turnOffWhenBright}
							onChange={(e) => handleInputChange('turnOffWhenBright', parseFloat(e.target.value), 'lightThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>
				</div>

				{/* Pump Thresholds */}
				<div className="settings-card">
					<h3>💧 Pump Thresholds</h3>

					<div className="input-group">
						<label>Turn on when dry (0-1):</label>
						<input
							type="number"
							min="0"
							max="1"
							step="0.1"
							value={settings.pumpThresholds.turnOnWhenDry}
							onChange={(e) => handleInputChange('turnOnWhenDry', parseFloat(e.target.value), 'pumpThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>

					<div className="input-group">
						<label>Turn off when wet (0-1):</label>
						<input
							type="number"
							min="0"
							max="1"
							step="0.1"
							value={settings.pumpThresholds.turnOffWhenWet}
							onChange={(e) => handleInputChange('turnOffWhenWet', parseFloat(e.target.value), 'pumpThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>
				</div>

				{/* Temperature Thresholds */}
				<div className="settings-card">
					<h3>🌡️ Temperature Thresholds</h3>

					<div className="input-group">
						<label>Window open temperature (°C):</label>
						<input
							type="number"
							value={settings.temperatureThresholds.windowOpenTemp}
							onChange={(e) => handleInputChange('windowOpenTemp', parseInt(e.target.value), 'temperatureThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>

					<div className="input-group">
						<label>Window close temperature (°C):</label>
						<input
							type="number"
							value={settings.temperatureThresholds.windowCloseTemp}
							onChange={(e) => handleInputChange('windowCloseTemp', parseInt(e.target.value), 'temperatureThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>

					<div className="input-group">
						<label>Door open temperature (°C):</label>
						<input
							type="number"
							value={settings.temperatureThresholds.doorOpenTemp}
							onChange={(e) => handleInputChange('doorOpenTemp', parseInt(e.target.value), 'temperatureThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>

					<div className="input-group">
						<label>Door close temperature (°C):</label>
						<input
							type="number"
							value={settings.temperatureThresholds.doorCloseTemp}
							onChange={(e) => handleInputChange('doorCloseTemp', parseInt(e.target.value), 'temperatureThresholds')}
							disabled={isAnyActionInProgress}
						/>
					</div>
				</div>

				{/* Emergency Settings */}
				<div className="settings-card">
					<h3>🚨 Emergency Settings</h3>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.rainSettings.autoCloseWindowOnRain}
								onChange={(e) => handleInputChange('autoCloseWindowOnRain', e.target.checked, 'rainSettings')}
								disabled={isAnyActionInProgress}
							/>
							🌧️ Close window on rain
						</label>
					</div>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.waterLevelSettings.autoTurnOffPumpOnFlood}
								onChange={(e) => handleInputChange('autoTurnOffPumpOnFlood', e.target.checked, 'waterLevelSettings')}
								disabled={isAnyActionInProgress}
							/>
							🌊 Turn off pump on flood
						</label>
					</div>

					<div className="control-item">
						<label>
							<input
								type="checkbox"
								checked={settings.waterLevelSettings.autoOpenDoorOnFlood}
								onChange={(e) => handleInputChange('autoOpenDoorOnFlood', e.target.checked, 'waterLevelSettings')}
								disabled={isAnyActionInProgress}
							/>
							🚪 Open door on flood
						</label>
					</div>
				</div>
			</div>

			<div className="action-buttons">
				<button
					onClick={saveSettings}
					disabled={isAnyActionInProgress}
					className="save-btn"
				>
					{saving ? 'Saving...' : 'Save Settings'}
				</button>

				<button
					onClick={loadSettings}
					disabled={isAnyActionInProgress}
					className="reload-btn"
				>
					{reloading ? 'Reloading...' : 'Reload Settings'}
				</button>

				<button
					onClick={runAutomationCheck}
					disabled={isAnyActionInProgress}
					className="run-check-btn"
				>
					{runningCheck ? 'Running Check...' : '🔍 Run Check'}
				</button>

				<button
					onClick={resetToDefaults}
					disabled={isAnyActionInProgress}
					className="reset-btn"
				>
					{resetting ? 'Resetting...' : 'Reset to Defaults'}
				</button>
			</div>
		</div>
	);
};

export default AutoModePage;
