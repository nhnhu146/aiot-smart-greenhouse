// Hook to connect API client with Toast context for seamless error handling
import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { setGlobalErrorHandler } from '../lib/apiClientEnhanced';

// Global success handler reference
let globalSuccessHandler: ((message: string, duration?: number) => void) | null = null;

export const setGlobalSuccessHandler = (handler: (message: string, duration?: number) => void) => {
	globalSuccessHandler = handler;
};

export const useApiErrorHandler = () => {
	const { showError, showSuccess } = useToast();

	useEffect(() => {
		// Set the global error handler for API client
		setGlobalErrorHandler(showError);
		
		// Set the global success handler
		setGlobalSuccessHandler(showSuccess);

		// Cleanup on unmount
		return () => {
			setGlobalErrorHandler(() => {});
			setGlobalSuccessHandler(() => {});
		};
	}, [showError, showSuccess]);

	return {
		showError,
		showSuccess,
		showApiSuccess: (message: string, duration?: number) => {
			if (globalSuccessHandler) {
				globalSuccessHandler(message, duration);
			}
		}
	};
};

export default useApiErrorHandler;