import React from 'react';

interface UnsavedWarningProps {
	unsavedCount: number;
}

const UnsavedWarning: React.FC<UnsavedWarningProps> = ({ unsavedCount }) => {
	if (unsavedCount === 0) return null;

	return (
		<div className="unsaved-warning">
			⚠️ {unsavedCount} Unsaved value{unsavedCount > 1 ? 's' : ''}
		</div>
	);
};

export default UnsavedWarning;
