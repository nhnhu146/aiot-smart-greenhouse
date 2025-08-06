// Component to initialize API error handling
import React from 'react';
import useApiErrorHandler from '../../hooks/useApiErrorHandler';

interface ApiErrorHandlerProps {
	children: React.ReactNode;
}

const ApiErrorHandler: React.FC<ApiErrorHandlerProps> = ({ children }) => {
	// This hook will set up the global error handlers
	useApiErrorHandler();

	return <>{children}</>;
};

export default ApiErrorHandler;