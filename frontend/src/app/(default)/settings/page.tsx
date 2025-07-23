'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Badge, Tab, Tabs } from 'react-bootstrap';
import apiClient from '@/lib/apiClient';
import MockDataToggle from '@/components/MockDataToggle/MockDataToggle';
import withAuth from '@/components/withAuth/withAuth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
		soilMoistureThreshold: { min: 1, max: 1 },
		waterLevelThreshold: { min: 20, max: 90 }
	});

	const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
	const [emailAlerts, setEmailAlerts] = useState<EmailAlertsConfig>({
		temperature: true,
		humidity: true,
		soilMoisture: true,
		waterLevel: true
	});

	const [newEmail, setNewEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [message, setMessage] = useState<SystemMessage | null>(null);
	const [loading, setLoading] = useState(false);
	const [testingEmail, setTestingEmail] = useState(false);
	const [activeTab, setActiveTab] = useState('thresholds');
	const [emailStatus, setEmailStatus] = useState<any>(null);

	// Track unsaved changes
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [originalThresholds, setOriginalThresholds] = useState<ThresholdSettings>({
		temperatureThreshold: { min: 18, max: 30 },
		humidityThreshold: { min: 40, max: 80 },
		soilMoistureThreshold: { min: 1, max: 1 },
		waterLevelThreshold: { min: 20, max: 90 }
	});
	const [originalEmailRecipients, setOriginalEmailRecipients] = useState<string[]>([]);
	const [originalEmailAlerts, setOriginalEmailAlerts] = useState<EmailAlertsConfig>({
		temperature: true,
		humidity: true,
		soilMoisture: true,
		waterLevel: true
	});

	const loadSettings = useCallback(async () => {
		try {
			setLoading(true);
			const response = await apiClient.getSettings();

			if (response.success && response.data) {
				// Load thresholds
				if (response.data.temperatureThreshold) {
					const loadedThresholds = {
						temperatureThreshold: response.data.temperatureThreshold,
						humidityThreshold: response.data.humidityThreshold,
						soilMoistureThreshold: response.data.soilMoistureThreshold,
						waterLevelThreshold: response.data.waterLevelThreshold
					};
					setThresholds(loadedThresholds);
					setOriginalThresholds(loadedThresholds);
				}

				// Load email recipients
				if (response.data.notifications?.emailRecipients) {
					setEmailRecipients(response.data.notifications.emailRecipients);
					setOriginalEmailRecipients(response.data.notifications.emailRecipients);
				}

				// Load email alert settings
				if (response.data.emailAlerts) {
					setEmailAlerts(response.data.emailAlerts);
					setOriginalEmailAlerts(response.data.emailAlerts);
				}

				// Reset unsaved changes flag after loading
				setHasUnsavedChanges(false);
			}
		} catch (error) {
			console.error('Error loading settings:', error);
			showMessage('error', 'Failed to load settings');
		} finally {
			setLoading(false);
		}
	}, []);

	// Load settings on component mount
	useEffect(() => {
		loadSettings();
		loadEmailStatus();
	}, [loadSettings]);

	const loadEmailStatus = async () => {
		try {
			const response = await apiClient.getEmailStatus();
			setEmailStatus(response.data);
		} catch (error) {
			console.error('Error loading email status:', error);
		}
	};

	// Check if settings have unsaved changes
	const checkForChanges = useCallback(() => {
		const thresholdsChanged = JSON.stringify(thresholds) !== JSON.stringify(originalThresholds);
		const emailRecipientsChanged = JSON.stringify(emailRecipients) !== JSON.stringify(originalEmailRecipients);
		const emailAlertsChanged = JSON.stringify(emailAlerts) !== JSON.stringify(originalEmailAlerts);

		const hasChanges = thresholdsChanged || emailRecipientsChanged || emailAlertsChanged;
		setHasUnsavedChanges(hasChanges);
		return hasChanges;
	}, [thresholds, originalThresholds, emailRecipients, originalEmailRecipients, emailAlerts, originalEmailAlerts]);

	// Check for changes whenever settings change
	useEffect(() => {
		checkForChanges();
	}, [checkForChanges]);

	// Confirmation dialog for unsaved changes
	const confirmAction = (action: () => void, actionName: string) => {
		if (hasUnsavedChanges) {
			const confirmed = window.confirm(
				`You have unsaved changes. Are you sure you want to ${actionName} without saving?`
			);
			if (confirmed) {
				action();
			}
		} else {
			action();
		}
	};

	const showMessage = (type: SystemMessage['type'], text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 5000);
	};

	const isValidEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const addEmailRecipient = () => {
		if (!newEmail.trim()) {
			setEmailError('Please enter an email address');
			return;
		}

		if (!isValidEmail(newEmail)) {
			setEmailError('Please enter a valid email address');
			return;
		}

		if (emailRecipients.includes(newEmail)) {
			setEmailError('Email address already exists');
			return;
		}

		setEmailRecipients([...emailRecipients, newEmail]);
		setNewEmail('');
		setEmailError('');
	};

	const removeEmailRecipient = (email: string) => {
		setEmailRecipients(emailRecipients.filter(e => e !== email));
	};

	const testEmail = async () => {
		if (emailRecipients.length === 0) {
			showMessage('warning', 'Please add at least one email recipient');
			return;
		}

		// Check for unsaved changes before testing
		if (hasUnsavedChanges) {
			const confirmed = window.confirm(
				'You have unsaved changes to your email settings. Please save your changes first before testing email functionality.'
			);
			if (!confirmed) {
				return;
			}
			showMessage('warning', 'Please save your settings first before testing email');
			return;
		}

		setTestingEmail(true);
		try {
			const response = await apiClient.testEmail(emailRecipients);
			showMessage('success', response.message || 'Test email sent successfully');
		} catch (error) {
			showMessage('error', 'Failed to send test email');
		} finally {
			setTestingEmail(false);
		}
	};

	const saveThresholds = async () => {
		setLoading(true);
		try {
			await apiClient.saveThresholds(thresholds);
			setOriginalThresholds({ ...thresholds });
			setHasUnsavedChanges(false);
			showMessage('success', 'Alert thresholds saved successfully!');
		} catch (error) {
			showMessage('error', 'Failed to save thresholds');
		} finally {
			setLoading(false);
		}
	};

	const saveEmailSettings = async () => {
		setLoading(true);
		try {
			// Save email recipients
			if (emailRecipients.length > 0) {
				await apiClient.saveEmailRecipients(emailRecipients);
			}

			// Save email alert configuration
			await apiClient.saveEmailAlerts(emailAlerts);

			// Update original values
			setOriginalEmailRecipients([...emailRecipients]);
			setOriginalEmailAlerts({ ...emailAlerts });
			setHasUnsavedChanges(false);

			showMessage('success', 'Email settings saved successfully!');
		} catch (error) {
			showMessage('error', 'Failed to save email settings');
		} finally {
			setLoading(false);
		}
	};

	const resetToDefaults = () => {
		setThresholds({
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 1, max: 1 },
			waterLevelThreshold: { min: 20, max: 90 }
		});

		setEmailAlerts({
			temperature: true,
			humidity: true,
			soilMoisture: true,
			waterLevel: true
		});

		showMessage('info', 'Settings reset to defaults');
	};

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<div className="d-flex align-items-center gap-3">
					<h2 className="mb-0 text-black">⚙️ System Configuration</h2>
					{hasUnsavedChanges && (
						<Badge bg="warning" text="dark">
							⚠️ Unsaved Changes
						</Badge>
					)}
				</div>
				<Badge bg={emailStatus?.enabled ? 'success' : 'secondary'}>
					Email: {emailStatus?.enabled ? 'Enabled' : 'Disabled'}
				</Badge>
			</div>

			{message && (
				<Alert variant={message.type === 'success' ? 'success' :
					message.type === 'error' ? 'danger' :
						message.type === 'warning' ? 'warning' : 'info'}>
					{message.text}
				</Alert>
			)}

			<Tabs
				activeKey={activeTab}
				onSelect={(k) => setActiveTab(k || 'thresholds')}
				className="mb-4"
				fill
			>
				{/* Threshold Settings Tab */}
				<Tab eventKey="thresholds" title="🎯 Alert Thresholds">
					<Card>
						<Card.Header>
							<h5 className="mb-0">Sensor Alert Thresholds</h5>
						</Card.Header>
						<Card.Body>
							<Row>
								{/* Temperature Settings */}
								<Col md={6} className="mb-4">
									<h6>🌡️ Temperature (°C)</h6>
									<Row>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Minimum</Form.Label>
												<Form.Control
													type="number"
													value={thresholds.temperatureThreshold.min}
													onChange={(e) => setThresholds({
														...thresholds,
														temperatureThreshold: {
															...thresholds.temperatureThreshold,
															min: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Maximum</Form.Label>
												<Form.Control
													type="number"
													value={thresholds.temperatureThreshold.max}
													onChange={(e) => setThresholds({
														...thresholds,
														temperatureThreshold: {
															...thresholds.temperatureThreshold,
															max: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
									</Row>
								</Col>

								{/* Humidity Settings */}
								<Col md={6} className="mb-4">
									<h6>💧 Humidity (%)</h6>
									<Row>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Minimum</Form.Label>
												<Form.Control
													type="number"
													value={thresholds.humidityThreshold.min}
													onChange={(e) => setThresholds({
														...thresholds,
														humidityThreshold: {
															...thresholds.humidityThreshold,
															min: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Maximum</Form.Label>
												<Form.Control
													type="number"
													value={thresholds.humidityThreshold.max}
													onChange={(e) => setThresholds({
														...thresholds,
														humidityThreshold: {
															...thresholds.humidityThreshold,
															max: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
									</Row>
								</Col>

								{/* Soil Moisture Settings */}
								<Col md={6} className="mb-4">
									<h6>🌱 Soil Moisture (Binary)</h6>
									<Row>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Minimum (0=Dry, 1=Wet)</Form.Label>
												<Form.Control
													type="number"
													min="0"
													max="1"
													step="1"
													value={thresholds.soilMoistureThreshold.min}
													onChange={(e) => setThresholds({
														...thresholds,
														soilMoistureThreshold: {
															...thresholds.soilMoistureThreshold,
															min: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Maximum (0=Dry, 1=Wet)</Form.Label>
												<Form.Control
													type="number"
													min="0"
													max="1"
													step="1"
													value={thresholds.soilMoistureThreshold.max}
													onChange={(e) => setThresholds({
														...thresholds,
														soilMoistureThreshold: {
															...thresholds.soilMoistureThreshold,
															max: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
									</Row>
								</Col>

								{/* Water Level Settings */}
								<Col md={6} className="mb-4">
									<h6>🚰 Water Level (%)</h6>
									<Row>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Minimum</Form.Label>
												<Form.Control
													type="number"
													value={thresholds.waterLevelThreshold.min}
													onChange={(e) => setThresholds({
														...thresholds,
														waterLevelThreshold: {
															...thresholds.waterLevelThreshold,
															min: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
										<Col>
											<Form.Group className="mb-2">
												<Form.Label>Maximum</Form.Label>
												<Form.Control
													type="number"
													value={thresholds.waterLevelThreshold.max}
													onChange={(e) => setThresholds({
														...thresholds,
														waterLevelThreshold: {
															...thresholds.waterLevelThreshold,
															max: Number(e.target.value)
														}
													})}
												/>
											</Form.Group>
										</Col>
									</Row>
								</Col>
							</Row>

							<div className="d-flex gap-2">
								<Button
									variant={hasUnsavedChanges ? "success" : "primary"}
									onClick={saveThresholds}
									disabled={loading}
								>
									{loading ? <Spinner size="sm" /> : hasUnsavedChanges ? '💾 Save Changes' : '💾 Save Thresholds'}
								</Button>
								<Button
									variant="outline-secondary"
									onClick={() => confirmAction(resetToDefaults, "reset to defaults")}
								>
									🔄 Reset to Defaults
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Tab>

				{/* Email Settings Tab */}
				<Tab eventKey="email" title="📧 Email Alerts">
					<Card>
						<Card.Header>
							<h5 className="mb-0">Email Alert Configuration</h5>
						</Card.Header>
						<Card.Body>
							{/* Email Recipients */}
							<div className="mb-4">
								<h6>📧 Email Recipients</h6>
								<Row>
									<Col md={8}>
										<Form.Control
											type="email"
											placeholder="Enter email address"
											value={newEmail}
											onChange={(e) => setNewEmail(e.target.value)}
											onKeyPress={(e) => e.key === 'Enter' && addEmailRecipient()}
											isInvalid={!!emailError}
										/>
										{emailError && (
											<Form.Control.Feedback type="invalid">
												{emailError}
											</Form.Control.Feedback>
										)}
									</Col>
									<Col md={4}>
										<Button variant="outline-primary" onClick={addEmailRecipient}>
											➕ Add
										</Button>
									</Col>
								</Row>

								{emailRecipients.length > 0 && (
									<div className="mt-3">
										<h6>Current Recipients:</h6>
										{emailRecipients.map((email, index) => (
											<div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
												<span>{email}</span>
												<Button
													size="sm"
													variant="outline-danger"
													onClick={() => removeEmailRecipient(email)}
												>
													🗑️ Remove
												</Button>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Email Alert Types */}
							<div className="mb-4">
								<h6>🚨 Alert Types</h6>
								<p className="text-muted">Configure which alerts should trigger email notifications</p>

								<Row>
									<Col md={6}>
										<Form.Check
											type="switch"
											id="temperature-email-switch"
											label="🌡️ Temperature Alerts"
											checked={emailAlerts.temperature}
											onChange={(e) => setEmailAlerts({
												...emailAlerts,
												temperature: e.target.checked
											})}
										/>
									</Col>
									<Col md={6}>
										<Form.Check
											type="switch"
											id="humidity-email-switch"
											label="💧 Humidity Alerts"
											checked={emailAlerts.humidity}
											onChange={(e) => setEmailAlerts({
												...emailAlerts,
												humidity: e.target.checked
											})}
										/>
									</Col>
									<Col md={6}>
										<Form.Check
											type="switch"
											id="soil-email-switch"
											label="🌱 Soil Moisture Alerts"
											checked={emailAlerts.soilMoisture}
											onChange={(e) => setEmailAlerts({
												...emailAlerts,
												soilMoisture: e.target.checked
											})}
										/>
									</Col>
									<Col md={6}>
										<Form.Check
											type="switch"
											id="water-email-switch"
											label="🚰 Water Level Alerts"
											checked={emailAlerts.waterLevel}
											onChange={(e) => setEmailAlerts({
												...emailAlerts,
												waterLevel: e.target.checked
											})}
										/>
									</Col>
								</Row>
							</div>

							<div className="d-flex gap-2">
								<Button
									variant={hasUnsavedChanges ? "success" : "primary"}
									onClick={saveEmailSettings}
									disabled={loading}
								>
									{loading ? <Spinner size="sm" /> : hasUnsavedChanges ? '💾 Save Changes' : '💾 Save Email Settings'}
								</Button>
								<Button
									variant="outline-info"
									onClick={testEmail}
									disabled={testingEmail || emailRecipients.length === 0 || hasUnsavedChanges}
									title={hasUnsavedChanges ? "Please save settings before testing email" : ""}
								>
									{testingEmail ? <Spinner size="sm" /> : '📧 Send Test Email'}
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Tab>

				{/* Data Source Tab */}
				<Tab eventKey="data" title="📊 Data Source">
					<Card>
						<Card.Header>
							<h5 className="mb-0">Data Source Configuration</h5>
						</Card.Header>
						<Card.Body>
							<MockDataToggle />
							<div className="mt-3">
								<Alert variant="info">
									<h6>📝 Information</h6>
									<ul className="mb-0">
										<li><strong>Real Data:</strong> Live sensor data from MQTT broker</li>
										<li><strong>Mock Data:</strong> Simulated data for testing and development</li>
										<li>Changes take effect immediately and affect all connected clients</li>
									</ul>
								</Alert>
							</div>
						</Card.Body>
					</Card>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default withAuth(SettingsPage);
