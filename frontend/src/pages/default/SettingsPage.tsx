import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Tab, Tabs } from 'react-bootstrap';
import apiClient from '@/lib/apiClient';
import MockDataToggle from '@/components/MockDataToggle/MockDataToggle';
import ThresholdSettingsCard from '@/components/SettingsPage/ThresholdSettingsCard';
import EmailSettingsCard from '@/components/SettingsPage/EmailSettingsCard';
import UnsavedChangesWarning from '@/components/Common/UnsavedChangesWarning';
import withAuth from '@/components/withAuth/withAuth';

interface ThresholdSettings {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { min: number; max: number };
	waterLevelThreshold: { min: number; max: number };
}

interface EmailAlertsConfig {
	temperature: boolean;
	humidity: boolean;
	soilMoisture: boolean;
	waterLevel: boolean;
}

interface SystemMessage {
	type: 'success' | 'error' | 'warning' | 'info';
	text: string;
}

const SettingsPage = () => {
	// State management
	const [thresholds, setThresholds] = useState<ThresholdSettings>({
		temperatureThreshold: { min: 18, max: 30 },
		humidityThreshold: { min: 40, max: 80 },
		soilMoistureThreshold: { min: 0, max: 1 }, // Binary: 0=dry, 1=wet
		waterLevelThreshold: { min: 0, max: 1 }    // Binary: 0=none, 1=full
	});

	const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
	const [emailAlerts, setEmailAlerts] = useState<EmailAlertsConfig>({
		temperature: true,
		humidity: true,
		soilMoisture: true,
		waterLevel: true
	});

	// Alert frequency settings
	const [alertFrequency, setAlertFrequency] = useState<number>(5); // minutes
	const [batchAlerts, setBatchAlerts] = useState<boolean>(true);

	const [newEmail, setNewEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [message, setMessage] = useState<SystemMessage | null>(null);
	const [loading, setLoading] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [originalSettings, setOriginalSettings] = useState<any>(null);

	// Load settings on component mount
	useEffect(() => {
		loadSettings();
	}, []);

	// Track changes to determine if there are unsaved changes
	useEffect(() => {
		if (originalSettings) {
			const currentSettings = {
				thresholds,
				emailRecipients,
				emailAlerts,
				alertFrequency,
				batchAlerts
			};
			const hasChanged = JSON.stringify(currentSettings) !== JSON.stringify(originalSettings);
			setHasUnsavedChanges(hasChanged);
		}
	}, [thresholds, emailRecipients, emailAlerts, alertFrequency, batchAlerts, originalSettings]);

	const loadSettings = async () => {
		try {
			setLoading(true);
			const response = await apiClient.getSettings();
			if (response.success) {
				const settings = response.data;
				if (settings.thresholds) setThresholds(settings.thresholds);
				if (settings.emailRecipients) setEmailRecipients(settings.emailRecipients);
				if (settings.emailAlerts) setEmailAlerts(settings.emailAlerts);
				if (settings.alertFrequency) setAlertFrequency(settings.alertFrequency);
				if (settings.batchAlerts !== undefined) setBatchAlerts(settings.batchAlerts);

				// Store original settings for comparison
				setOriginalSettings({
					thresholds: settings.thresholds || thresholds,
					emailRecipients: settings.emailRecipients || [],
					emailAlerts: settings.emailAlerts || emailAlerts,
					alertFrequency: settings.alertFrequency || alertFrequency,
					batchAlerts: settings.batchAlerts !== undefined ? settings.batchAlerts : batchAlerts
				});
				setHasUnsavedChanges(false);
			}
		} catch (error) {
			setMessage({ type: 'error', text: 'Failed to load settings' });
		} finally {
			setLoading(false);
		}
	};

	const saveSettings = async () => {
		try {
			setLoading(true);
			const settings = {
				thresholds,
				emailRecipients,
				emailAlerts,
				alertFrequency,
				batchAlerts
			};

			const response = await apiClient.saveSettings(settings);
			if (response.success) {
				setMessage({ type: 'success', text: 'Settings saved successfully!' });
				setOriginalSettings(settings);
				setHasUnsavedChanges(false);

				// Dispatch custom event to refresh history data
				window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
			}
		} catch (error) {
			setMessage({ type: 'error', text: 'Failed to save settings' });
		} finally {
			setLoading(false);
		}
	};

	const handleThresholdChange = useCallback((key: keyof ThresholdSettings, field: 'min' | 'max', value: number) => {
		setThresholds(prev => ({
			...prev,
			[key]: { ...prev[key], [field]: value }
		}));
	}, []);

	// Test email functionality
	const sendTestEmail = async () => {
		if (emailRecipients.length === 0) {
			setMessage({ type: 'warning', text: 'Please add at least one email recipient first' });
			return;
		}

		try {
			setLoading(true);
			const response = await apiClient.testEmail(emailRecipients);
			if (response.success) {
				setMessage({ type: 'success', text: 'Test email sent successfully!' });
			}
		} catch (error) {
			setMessage({ type: 'error', text: 'Failed to send test email' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>⚙️ System Settings</h2>
				<div className="d-flex gap-2">
					{loading && <Spinner size="sm" />}
					<Button variant="success" onClick={saveSettings} disabled={loading}>
						💾 Save Settings
					</Button>
				</div>
			</div>

			{message && (
				<Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
					{message.text}
				</Alert>
			)}

			<UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} />

			<Tabs defaultActiveKey="thresholds" className="mb-4">
				<Tab eventKey="thresholds" title="📊 Sensor Thresholds">
					<ThresholdSettingsCard
						thresholds={thresholds}
						onThresholdChange={handleThresholdChange}
						hasUnsavedChanges={hasUnsavedChanges}
					/>
				</Tab>

				<Tab eventKey="email" title="📧 Email Alerts">
					<EmailSettingsCard
						emailRecipients={emailRecipients}
						emailAlerts={emailAlerts}
						alertFrequency={alertFrequency}
						batchAlerts={batchAlerts}
						newEmail={newEmail}
						emailError={emailError}
						onEmailRecipientsChange={setEmailRecipients}
						onEmailAlertsChange={setEmailAlerts}
						onAlertFrequencyChange={setAlertFrequency}
						onBatchAlertsChange={setBatchAlerts}
						onNewEmailChange={setNewEmail}
						onEmailErrorChange={setEmailError}
					/>
					<Button variant="outline-primary" onClick={sendTestEmail} disabled={loading}>
						📧 Send Test Email
					</Button>
				</Tab>

				<Tab eventKey="data" title="🎭 Data Sources">
					<Card>
						<Card.Header>
							<h5 className="mb-0">Data Source Configuration</h5>
						</Card.Header>
						<Card.Body>
							<MockDataToggle />
						</Card.Body>
					</Card>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default withAuth(SettingsPage);
