/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserSettings {
	userId: string;
	email: string;
	alertRecipients: string[];
	mqttConfig?: {
		brokerUrl?: string;
		username?: string;
		password?: string;
		clientId?: string;
	};
	alertThresholds?: {
		temperature?: { min: number; max: number; };
		humidity?: { min: number; max: number; };
		soilMoisture?: { min: number; max: number; };
		waterLevel?: { min: number; };
	};
}

interface UserSettingsContextType {
	settings: UserSettings | null;
	updateAlertRecipients: (recipients: string[]) => Promise<void>;
	updateMqttConfig: (config: any) => Promise<void>;
	updateAlertThresholds: (thresholds: any) => Promise<void>;
	resetSettings: () => Promise<void>;
	loading: boolean;
	error: string | null;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const useUserSettings = () => {
	const context = useContext(UserSettingsContext);
	if (context === undefined) {
		throw new Error('useUserSettings must be used within a UserSettingsProvider');
	}
	return context;
};

interface UserSettingsProviderProps {
	children: React.ReactNode;
}

export const UserSettingsProvider: React.FC<UserSettingsProviderProps> = ({ children }) => {
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

	const getAuthToken = () => {
		return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
	};

	const getAuthHeaders = useCallback(() => {
		const token = getAuthToken();
		return {
			'Content-Type': 'application/json',
			...(token && { 'Authorization': `Bearer ${token}` })
		};
	}, []);

	const loadSettings = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const token = getAuthToken();
			if (!token) {
				setError('Authentication required');
				setLoading(false);
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/user-settings`, {
				headers: getAuthHeaders()
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to load settings');
			}

			const data = await response.json();
			if (data.success) {
				setSettings(data.data);
			} else {
				throw new Error(data.message || 'Failed to load settings');
			}
		} catch (err) {
			console.error('Error loading user settings:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, []);

	const updateAlertRecipients = useCallback(async (recipients: string[]) => {
		try {
			setError(null);
			const response = await fetch(`${API_BASE_URL}/api/user-settings/alert-recipients`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify({ recipients })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update alert recipients');
			}

			const data = await response.json();
			if (data.success && settings) {
				setSettings({
					...settings,
					alertRecipients: data.data.alertRecipients
				});
			}
		} catch (err) {
			console.error('Error updating alert recipients:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
			throw err;
		}
	}, [getAuthHeaders, settings]);

	const updateMqttConfig = useCallback(async (config: any) => {
		try {
			setError(null);
			const response = await fetch(`${API_BASE_URL}/api/user-settings/mqtt-config`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify(config)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update MQTT config');
			}

			const data = await response.json();
			if (data.success && settings) {
				setSettings({
					...settings,
					mqttConfig: data.data.mqttConfig
				});
			}
		} catch (err) {
			console.error('Error updating MQTT config:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
			throw err;
		}
	}, [getAuthHeaders, settings]);

	const updateAlertThresholds = useCallback(async (thresholds: any) => {
		try {
			setError(null);
			const response = await fetch(`${API_BASE_URL}/api/user-settings/alert-thresholds`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify(thresholds)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update alert thresholds');
			}

			const data = await response.json();
			if (data.success && settings) {
				setSettings({
					...settings,
					alertThresholds: data.data.alertThresholds
				});
			}
		} catch (err) {
			console.error('Error updating alert thresholds:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
			throw err;
		}
	}, [getAuthHeaders, settings]);

	const resetSettings = useCallback(async () => {
		try {
			setError(null);
			const response = await fetch(`${API_BASE_URL}/api/user-settings/reset`, {
				method: 'POST',
				headers: getAuthHeaders()
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to reset settings');
			}

			const data = await response.json();
			if (data.success) {
				setSettings(data.data);
			}
		} catch (err) {
			console.error('Error resetting settings:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
			throw err;
		}
	}, [getAuthHeaders]);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const contextValue: UserSettingsContextType = {
		settings,
		updateAlertRecipients,
		updateMqttConfig,
		updateAlertThresholds,
		resetSettings,
		loading,
		error
	};

	return (
		<UserSettingsContext.Provider value={contextValue}>
			{children}
		</UserSettingsContext.Provider>
	);
};
