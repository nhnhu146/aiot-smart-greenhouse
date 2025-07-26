'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { useAutomation } from '@/hooks/useAutomation';
import styles from './automode.module.scss';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

interface MotionSettings {
	autoOpenDoorOnMotion: boolean;
	autoCloseAfterMotion: boolean;
	motionTimeoutMinutes: number;
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
	motionSettings: MotionSettings;
	rainSettings: RainSettings;
	waterLevelSettings: WaterLevelSettings;
	createdAt?: string;
	updatedAt?: string;
}

const AutomodeSettings = () => {
	const { config: automationConfig, toggleAutomation, updateConfig, loading: hookLoading, updating: hookUpdating } = useAutomation();

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
		motionSettings: {
			autoOpenDoorOnMotion: true,
			autoCloseAfterMotion: false,
			motionTimeoutMinutes: 5
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
	const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

	// Check if any action is in progress
	const isAnyActionInProgress = loading || saving || resetting || reloading || hookUpdating;

	// Sync main automation toggle with the shared hook
	const autoMode = automationConfig?.enabled ?? false;

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
				showMessage('success', 'Settings reset to defaults!');
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

	const showMessage = (type: 'success' | 'danger', text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 5000);
	};

	const updateSettings = (path: string, value: any) => {
		setSettings(prev => {
			const keys = path.split('.');
			const newSettings = { ...prev };
			let current: any = newSettings;

			for (let i = 0; i < keys.length - 1; i++) {
				current[keys[i]] = { ...current[keys[i]] };
				current = current[keys[i]];
			}

			current[keys[keys.length - 1]] = value;
			return newSettings;
		});
	};

	if (loading) {
		return (
			<Container className="mt-4">
				<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
					<Spinner animation="border" role="status">
						<span className="visually-hidden">Loading automation settings...</span>
					</Spinner>
				</div>
			</Container>
		);
	}

	return (
		<Container className="mt-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<div>
					<h2>🤖 AutoMode Settings</h2>
					<p className="text-muted">Configure automatic device control based on sensor readings</p>
				</div>
				<Badge bg={autoMode ? 'success' : 'secondary'} className="fs-6">
					{autoMode ? 'ENABLED' : 'DISABLED'}
				</Badge>
			</div>

			{message && (
				<Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
					{message.text}
				</Alert>
			)}

			{/* Master Control */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🎛️ Master Control</h5>
				</Card.Header>
				<Card.Body>
					<div className="d-flex align-items-center gap-2 mb-3">
						<Form.Check
							type="switch"
							id="automation-enabled"
							label={<strong>Enable Automation System</strong>}
							checked={autoMode}
							onChange={toggleAutomation}
							disabled={hookUpdating}
						/>
						{hookUpdating && <Spinner size="sm" />}
					</div>
					<p className="text-muted small">
						Master switch for all automation features. When disabled, all automatic device control will stop.
					</p>
				</Card.Body>
			</Card>

			{/* Device Control Enablement */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🔧 Device Control Settings</h5>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col md={6}>
							<Form.Check
								type="switch"
								id="light-control"
								label="💡 Auto Light Control"
								checked={settings.lightControlEnabled}
								onChange={(e) => updateSettings('lightControlEnabled', e.target.checked)}
								disabled={!autoMode}
								className="mb-3"
							/>
							<Form.Check
								type="switch"
								id="pump-control"
								label="💧 Auto Pump Control"
								checked={settings.pumpControlEnabled}
								onChange={(e) => updateSettings('pumpControlEnabled', e.target.checked)}
								disabled={!autoMode}
								className="mb-3"
							/>
						</Col>
						<Col md={6}>
							<Form.Check
								type="switch"
								id="door-control"
								label="🚪 Auto Door Control"
								checked={settings.doorControlEnabled}
								onChange={(e) => updateSettings('doorControlEnabled', e.target.checked)}
								disabled={!autoMode}
								className="mb-3"
							/>
							<Form.Check
								type="switch"
								id="window-control"
								label="🪟 Auto Window Control"
								checked={settings.windowControlEnabled}
								onChange={(e) => updateSettings('windowControlEnabled', e.target.checked)}
								disabled={!autoMode}
								className="mb-3"
							/>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Light Control Thresholds */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">💡 Light Control Thresholds</h5>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>Turn ON when light sensor reads:</Form.Label>
								<Form.Select
									value={settings.lightThresholds.turnOnWhenDark}
									onChange={(e) => updateSettings('lightThresholds.turnOnWhenDark', parseInt(e.target.value))}
									disabled={!autoMode || !settings.lightControlEnabled}
								>
									<option value={0}>0 (Dark)</option>
									<option value={1}>1 (Bright)</option>
								</Form.Select>
								<Form.Text className="text-muted">Typically set to 0 (turn on when dark)</Form.Text>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>Turn OFF when light sensor reads:</Form.Label>
								<Form.Select
									value={settings.lightThresholds.turnOffWhenBright}
									onChange={(e) => updateSettings('lightThresholds.turnOffWhenBright', parseInt(e.target.value))}
									disabled={!autoMode || !settings.lightControlEnabled}
								>
									<option value={0}>0 (Dark)</option>
									<option value={1}>1 (Bright)</option>
								</Form.Select>
								<Form.Text className="text-muted">Typically set to 1 (turn off when bright)</Form.Text>
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Pump Control Thresholds */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">💧 Pump Control Thresholds</h5>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>Turn ON when soil moisture reads:</Form.Label>
								<Form.Select
									value={settings.pumpThresholds.turnOnWhenDry}
									onChange={(e) => updateSettings('pumpThresholds.turnOnWhenDry', parseInt(e.target.value))}
									disabled={!autoMode || !settings.pumpControlEnabled}
								>
									<option value={0}>0 (Dry)</option>
									<option value={1}>1 (Wet)</option>
								</Form.Select>
								<Form.Text className="text-muted">Typically set to 0 (turn on when dry)</Form.Text>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>Turn OFF when soil moisture reads:</Form.Label>
								<Form.Select
									value={settings.pumpThresholds.turnOffWhenWet}
									onChange={(e) => updateSettings('pumpThresholds.turnOffWhenWet', parseInt(e.target.value))}
									disabled={!autoMode || !settings.pumpControlEnabled}
								>
									<option value={0}>0 (Dry)</option>
									<option value={1}>1 (Wet)</option>
								</Form.Select>
								<Form.Text className="text-muted">Typically set to 1 (turn off when wet)</Form.Text>
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Temperature Thresholds */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🌡️ Temperature Control Thresholds</h5>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col md={6}>
							<h6>Window Control</h6>
							<Form.Group className="mb-3">
								<Form.Label>Open window at temperature (°C):</Form.Label>
								<Form.Control
									type="number"
									value={settings.temperatureThresholds.windowOpenTemp}
									onChange={(e) => updateSettings('temperatureThresholds.windowOpenTemp', parseFloat(e.target.value))}
									disabled={!autoMode || !settings.windowControlEnabled}
									min={0}
									max={50}
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Close window at temperature (°C):</Form.Label>
								<Form.Control
									type="number"
									value={settings.temperatureThresholds.windowCloseTemp}
									onChange={(e) => updateSettings('temperatureThresholds.windowCloseTemp', parseFloat(e.target.value))}
									disabled={!autoMode || !settings.windowControlEnabled}
									min={0}
									max={50}
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<h6>Door Control (Emergency)</h6>
							<Form.Group className="mb-3">
								<Form.Label>Open door at temperature (°C):</Form.Label>
								<Form.Control
									type="number"
									value={settings.temperatureThresholds.doorOpenTemp}
									onChange={(e) => updateSettings('temperatureThresholds.doorOpenTemp', parseFloat(e.target.value))}
									disabled={!autoMode || !settings.doorControlEnabled}
									min={0}
									max={50}
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Close door at temperature (°C):</Form.Label>
								<Form.Control
									type="number"
									value={settings.temperatureThresholds.doorCloseTemp}
									onChange={(e) => updateSettings('temperatureThresholds.doorCloseTemp', parseFloat(e.target.value))}
									disabled={!autoMode || !settings.doorControlEnabled}
									min={0}
									max={50}
								/>
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Motion Detection Settings */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🏃 Motion Detection Settings</h5>
				</Card.Header>
				<Card.Body>
					<Form.Check
						type="switch"
						id="auto-open-door-motion"
						label="Auto-open door when motion detected"
						checked={settings.motionSettings.autoOpenDoorOnMotion}
						onChange={(e) => updateSettings('motionSettings.autoOpenDoorOnMotion', e.target.checked)}
						disabled={!autoMode || !settings.doorControlEnabled}
						className="mb-3"
					/>
					<Form.Check
						type="switch"
						id="auto-close-after-motion"
						label="Auto-close door after motion timeout"
						checked={settings.motionSettings.autoCloseAfterMotion}
						onChange={(e) => updateSettings('motionSettings.autoCloseAfterMotion', e.target.checked)}
						disabled={!autoMode || !settings.doorControlEnabled}
						className="mb-3"
					/>
					{settings.motionSettings.autoCloseAfterMotion && (
						<Form.Group className="mb-3">
							<Form.Label>Motion timeout (minutes):</Form.Label>
							<Form.Control
								type="number"
								value={settings.motionSettings.motionTimeoutMinutes}
								onChange={(e) => updateSettings('motionSettings.motionTimeoutMinutes', parseInt(e.target.value))}
								disabled={!autoMode || !settings.doorControlEnabled}
								min={1}
								max={60}
							/>
						</Form.Group>
					)}
				</Card.Body>
			</Card>

			{/* Rain Detection Settings */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🌧️ Rain Detection Settings</h5>
				</Card.Header>
				<Card.Body>
					<Form.Check
						type="switch"
						id="auto-close-window-rain"
						label="Auto-close window when rain detected"
						checked={settings.rainSettings.autoCloseWindowOnRain}
						onChange={(e) => updateSettings('rainSettings.autoCloseWindowOnRain', e.target.checked)}
						disabled={!autoMode || !settings.windowControlEnabled}
						className="mb-3"
					/>
					<Form.Check
						type="switch"
						id="auto-open-after-rain"
						label="Auto-open window when rain stops"
						checked={settings.rainSettings.autoOpenAfterRain}
						onChange={(e) => updateSettings('rainSettings.autoOpenAfterRain', e.target.checked)}
						disabled={!autoMode || !settings.windowControlEnabled}
						className="mb-3"
					/>
				</Card.Body>
			</Card>

			{/* Water Level Emergency Settings */}
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🚨 Water Level Emergency Settings</h5>
				</Card.Header>
				<Card.Body>
					<Form.Check
						type="switch"
						id="auto-turn-off-pump-flood"
						label="Auto-turn OFF pump when flood detected"
						checked={settings.waterLevelSettings.autoTurnOffPumpOnFlood}
						onChange={(e) => updateSettings('waterLevelSettings.autoTurnOffPumpOnFlood', e.target.checked)}
						disabled={!autoMode || !settings.pumpControlEnabled}
						className="mb-3"
					/>
					<Form.Check
						type="switch"
						id="auto-open-door-flood"
						label="Auto-open door for drainage when flood detected"
						checked={settings.waterLevelSettings.autoOpenDoorOnFlood}
						onChange={(e) => updateSettings('waterLevelSettings.autoOpenDoorOnFlood', e.target.checked)}
						disabled={!autoMode || !settings.doorControlEnabled}
						className="mb-3"
					/>
					<Alert variant="warning">
						<strong>Emergency Features:</strong> These settings help protect your greenhouse during flood conditions.
						The pump will be automatically turned off and door opened for drainage.
					</Alert>
				</Card.Body>
			</Card>

			{/* Action Buttons */}
			<Card className="mb-4">
				<Card.Body>
					<div className="d-flex gap-3">
						<Button
							variant="primary"
							onClick={saveSettings}
							disabled={isAnyActionInProgress}
							className={`${styles.actionButton} ${saving ? styles.saving : ''} d-flex align-items-center gap-2`}
						>
							{saving && <Spinner size="sm" />}
							💾 {saving ? 'Saving...' : 'Save Settings'}
						</Button>

						<Button
							variant="outline-secondary"
							onClick={resetToDefaults}
							disabled={isAnyActionInProgress}
							className={`${styles.actionButton} ${resetting ? styles.resetting : ''} d-flex align-items-center gap-2`}
						>
							{resetting && <Spinner size="sm" />}
							🔄 {resetting ? 'Resetting...' : 'Reset to Defaults'}
						</Button>

						<Button
							variant="outline-info"
							onClick={loadSettings}
							disabled={isAnyActionInProgress}
							className={`${styles.actionButton} ${reloading ? styles.loading : ''} d-flex align-items-center gap-2`}
						>
							{reloading && <Spinner size="sm" />}
							🔃 {reloading ? 'Reloading...' : 'Reload Settings'}
						</Button>
					</div>
				</Card.Body>
			</Card>

			{/* Info Card */}
			<Card className="mb-4">
				<Card.Header>
					<h6 className="mb-0">ℹ️ About AutoMode</h6>
				</Card.Header>
				<Card.Body>
					<p className="mb-2">
						<strong>AutoMode</strong> enables automatic device control based on real-time sensor readings:
					</p>
					<ul className="mb-0">
						<li><strong>Light Control:</strong> Automatically turns lights on/off based on ambient light levels</li>
						<li><strong>Irrigation Control:</strong> Controls water pump based on soil moisture levels</li>
						<li><strong>Climate Control:</strong> Manages windows and doors based on temperature</li>
						<li><strong>Security Features:</strong> Responds to motion detection automatically</li>
						<li><strong>Weather Protection:</strong> Closes windows when rain is detected</li>
						<li><strong>Emergency Response:</strong> Activates safety measures during flood conditions</li>
					</ul>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default AutomodeSettings;
