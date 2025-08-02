import React from 'react';
import { Alert } from 'react-bootstrap';

interface UnsavedChangesWarningProps {
	hasUnsavedChanges: boolean;
	className?: string;
}

const UnsavedChangesWarning: React.FC<UnsavedChangesWarningProps> = ({
	hasUnsavedChanges,
	className = ''
}) => {
	if (!hasUnsavedChanges) {
		return null;
	}

	return (
		<Alert variant="warning" className={`d-flex align-items-center mb-3 ${className}`}>
			<span className="me-2">⚠️</span>
			<strong>Unsaved Changes:</strong>
			<span className="ms-1">You have unsaved changes. Please save your configuration to apply changes.</span>
		</Alert>
	);
};

export default UnsavedChangesWarning;
