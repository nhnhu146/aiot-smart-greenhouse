// -*- coding: utf-8 -*-
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AutomationState {
	automationEnabled: boolean;
	loading: boolean;
	error: string | null;
}

interface AutomationContextType {
	state: AutomationState;
	toggleAutomation: () => Promise<boolean>;
	setAutomationEnabled: (enabled: boolean) => void;
}

const AutomationContext = createContext<AutomationContextType | undefined>(undefined);

export const AutomationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, setState] = useState<AutomationState>({
		automationEnabled: false,
		loading: false,
		error: null
	});

	const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

	// Load automation status from backend
	const loadAutomationStatus = useCallback(async () => {
		setState(prev => ({ ...prev, loading: true, error: null }));
		try {
			const response = await fetch(`${API_BASE_URL}/api/automation`);
			const data = await response.json();

			if (data.success && data.data) {
				setState(prev => ({
					...prev,
					automationEnabled: data.data.automationEnabled || false,
					loading: false
				}));
			} else {
				setState(prev => ({
					...prev,
					error: 'Failed to load automation status',
					loading: false
				}));
			}
		} catch (error) {
			console.error('Error loading automation status:', error);
			setState(prev => ({
				...prev,
				error: 'Failed to load automation status',
				loading: false
			}));
		}
	}, [API_BASE_URL]);

	// Toggle automation status
	const toggleAutomation = useCallback(async (): Promise<boolean> => {
		setState(prev => ({ ...prev, loading: true, error: null }));
		try {
			const newState = !state.automationEnabled;
			const response = await fetch(`${API_BASE_URL}/api/automation`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ automationEnabled: newState })
			});

			const data = await response.json();

			if (data.success) {
				setState(prev => ({
					...prev,
					automationEnabled: newState,
					loading: false
				}));
				return true;
			} else {
				setState(prev => ({
					...prev,
					error: 'Failed to toggle automation',
					loading: false
				}));
				return false;
			}
		} catch (error) {
			console.error('Error toggling automation:', error);
			setState(prev => ({
				...prev,
				error: 'Failed to toggle automation',
				loading: false
			}));
			return false;
		}
	}, [state.automationEnabled, API_BASE_URL]);

	// Set automation status directly (for sync purposes)
	const setAutomationEnabled = useCallback((enabled: boolean) => {
		setState(prev => ({
			...prev,
			automationEnabled: enabled
		}));
	}, []);

	// Load status on mount
	useEffect(() => {
		loadAutomationStatus();
	}, [loadAutomationStatus]);

	const contextValue: AutomationContextType = {
		state,
		toggleAutomation,
		setAutomationEnabled
	};

	return (
		<AutomationContext.Provider value={contextValue}>
			{children}
		</AutomationContext.Provider>
	);
};

export const useAutomationContext = (): AutomationContextType => {
	const context = useContext(AutomationContext);
	if (!context) {
		throw new Error('useAutomationContext must be used within an AutomationProvider');
	}
	return context;
};
