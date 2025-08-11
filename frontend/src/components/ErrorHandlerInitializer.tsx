import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { errorHandlingService } from '../services/ErrorHandlingService';

/**
 * Component to initialize error handling service with Toast context
 */
const ErrorHandlerInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { showError, showWarning, showInfo } = useToast();

	useEffect(() => {
		// Initialize error handling service with toast notifications
		errorHandlingService.initialize((message, variant) => {
			switch (variant) {
				case 'error':
					showError(message, 5000); // 5 second duration for errors
					break;
				case 'warning':
					showWarning(message, 4000); // 4 second duration for warnings
					break;
				case 'info':
					showInfo(message, 3000); // 3 second duration for info
					break;
			}
		});

		console.log('✅ Error handling service initialized');
	}, [showError, showWarning, showInfo]);

	return <>{children}</>;
};

export default ErrorHandlerInitializer;