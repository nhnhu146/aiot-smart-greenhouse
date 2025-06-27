'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import styles from './settings.module.scss';
import authService, { User } from '@/lib/authService';
import apiClient from '@/lib/apiClient';

interface ThresholdSettings {
	temperatureThreshold: { min: number; max: number };
	humidityThreshold: { min: number; max: number };
	soilMoistureThreshold: { min: number; max: number };
	waterLevelThreshold: { min: number; max: number };
}

const SystemSettingsPage = () => {
	const [thresholds, setThresholds] = useState<ThresholdSettings>({
		temperatureThreshold: { min: 18, max: 30 },
		humidityThreshold: { min: 40, max: 80 },
		soilMoistureThreshold: { min: 30, max: 70 },
		waterLevelThreshold: { min: 20, max: 90 }
	});

	const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
	const [newEmail, setNewEmail] = useState('');
	const [schedule, setSchedule] = useState('08:00');
	const [controlMode, setControlMode] = useState('auto');
	const [user, setUser] = useState<User | null>(null);
	const [emailError, setEmailError] = useState('');
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [loading, setLoading] = useState(false);
	const [testingEmail, setTestingEmail] = useState(false);

	useEffect(() => {
		const currentUser = authService.getCurrentUser();
		setUser(currentUser);
		if (currentUser?.email && !emailRecipients.includes(currentUser.email)) {
			setEmailRecipients([currentUser.email]);
		}
		loadSettings();
	}, [emailRecipients]);

	const loadSettings = async () => {
		try {
			const response = await apiClient.getSettings();
			if (response.success && response.data) {
				setThresholds({
					temperatureThreshold: response.data.temperatureThreshold,
					humidityThreshold: response.data.humidityThreshold,
					soilMoistureThreshold: response.data.soilMoistureThreshold,
					waterLevelThreshold: response.data.waterLevelThreshold
				});

				if (response.data.notifications?.emailRecipients) {
					setEmailRecipients(response.data.notifications.emailRecipients);
				}
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	};

	const isValidEmail = (email: string): boolean => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	};

	const addEmailRecipient = () => {
		if (!isValidEmail(newEmail)) {
			setEmailError('Invalid email format');
			return;
		}

		if (emailRecipients.includes(newEmail)) {
			setEmailError('Email already added');
			return;
		}

		setEmailRecipients([...emailRecipients, newEmail]);
		setNewEmail('');
		setEmailError('');
	};

	const removeEmailRecipient = (email: string) => {
		setEmailRecipients(emailRecipients.filter(e => e !== email));
	};

	const testEmail = async (email: string) => {
		setTestingEmail(true);
		try {
			const response = await fetch('/api/settings/test-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await response.json();
			setMessage({
				type: data.success ? 'success' : 'error',
				text: data.message
			});
		} catch (error) {
			setMessage({
				type: 'error',
				text: 'Failed to send test email'
			});
		} finally {
			setTestingEmail(false);
			setTimeout(() => setMessage(null), 5000);
		}
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			// Save thresholds and email recipients
			await apiClient.saveSettings({
				...thresholds,
				autoControl: { light: true, pump: true, door: true },
				notifications: {
					email: true,
					threshold: true,
					emailRecipients
				}
			});

			setMessage({
				type: 'success',
				text: 'Settings saved successfully!'
			});
		} catch (error) {
			setMessage({
				type: 'error',
				text: 'Error saving settings. Please try again.'
			});
		} finally {
			setLoading(false);
			setTimeout(() => setMessage(null), 5000);
		}
	};

	const handleReset = () => {
		setThresholds({
			temperatureThreshold: { min: 18, max: 30 },
			humidityThreshold: { min: 40, max: 80 },
			soilMoistureThreshold: { min: 30, max: 70 },
			waterLevelThreshold: { min: 20, max: 90 }
		});
		setEmailRecipients(user?.email ? [user.email] : []);
		setSchedule('08:00');
		setControlMode('auto');
		setEmailError('');
		setMessage(null);
	};

	return (
		<div className={styles.container}>
			<h2 className={styles.heading}>System Configuration</h2>

			{message && (
				<Alert variant={message.type === 'success' ? 'success' : 'danger'}>
					{message.text}
				</Alert>
			)}

			{/* Temperature Thresholds */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Temperature Thresholds (°C)</Card.Header>
				<Card.Body className={styles.cardBody}>
					<div className="row">
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Minimum Temperature</Form.Label>
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
						</div>
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Maximum Temperature</Form.Label>
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
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Humidity Thresholds */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Humidity Thresholds (%)</Card.Header>
				<Card.Body className={styles.cardBody}>
					<div className="row">
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Minimum Humidity</Form.Label>
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
						</div>
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Maximum Humidity</Form.Label>
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
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Soil Moisture Thresholds */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Soil Moisture Thresholds (%)</Card.Header>
				<Card.Body className={styles.cardBody}>
					<div className="row">
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Minimum Soil Moisture</Form.Label>
								<Form.Control
									type="number"
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
						</div>
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Maximum Soil Moisture</Form.Label>
								<Form.Control
									type="number"
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
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Water Level Thresholds */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Water Level Thresholds (%)</Card.Header>
				<Card.Body className={styles.cardBody}>
					<div className="row">
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Minimum Water Level</Form.Label>
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
						</div>
						<div className="col-md-6">
							<Form.Group className={styles.formGroup}>
								<Form.Label>Maximum Water Level</Form.Label>
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
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Email Settings */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Email Alert Recipients</Card.Header>
				<Card.Body className={styles.cardBody}>
					<Form.Group className={styles.formGroup}>
						<Form.Label>Add Email Recipient</Form.Label>
						<div className="d-flex gap-2">
							<Form.Control
								type="email"
								placeholder="Enter email address"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								isInvalid={!!emailError}
							/>
							<Button onClick={addEmailRecipient} variant="primary">Add</Button>
						</div>
						<Form.Control.Feedback type="invalid">
							{emailError}
						</Form.Control.Feedback>
					</Form.Group>

					{emailRecipients.length > 0 && (
						<div className={styles.emailList}>
							<Form.Label>Current Recipients:</Form.Label>
							{emailRecipients.map((email, index) => (
								<div key={index} className={styles.emailItem}>
									<span>{email}</span>
									<div>
										<Button
											size="sm"
											variant="outline-info"
											onClick={() => testEmail(email)}
											disabled={testingEmail}
											className="me-2"
										>
											{testingEmail ? <Spinner size="sm" /> : 'Test'}
										</Button>
										<Button
											size="sm"
											variant="outline-danger"
											onClick={() => removeEmailRecipient(email)}
										>
											Remove
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</Card.Body>
			</Card>

			{/* Schedule Settings */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Schedule Settings</Card.Header>
				<Card.Body className={styles.cardBody}>
					<Form.Group className={styles.formGroup}>
						<Form.Label>Auto Watering Time</Form.Label>
						<Form.Control
							type="time"
							value={schedule}
							onChange={(e) => setSchedule(e.target.value)}
						/>
					</Form.Group>
				</Card.Body>
			</Card>

			{/* Control Parameters */}
			<Card className={styles.card}>
				<Card.Header className={styles.cardHeader}>Control Parameters</Card.Header>
				<Card.Body className={styles.cardBody}>
					<Form.Group className={styles.formGroup}>
						<Form.Label>Mode</Form.Label>
						<Form.Select
							value={controlMode}
							onChange={(e) => setControlMode(e.target.value)}
						>
							<option value="auto">Automatic</option>
							<option value="manual">Manual</option>
						</Form.Select>
					</Form.Group>
				</Card.Body>
			</Card>

			<div className={styles.actions}>
				<Button variant="secondary" onClick={handleReset}>Reset to Default</Button>
				<Button
					variant="success"
					onClick={handleSave}
					disabled={loading}
				>
					{loading ? <Spinner size="sm" className="me-2" /> : null}
					Save Settings
				</Button>
			</div>
		</div>
	);
};

export default SystemSettingsPage;
