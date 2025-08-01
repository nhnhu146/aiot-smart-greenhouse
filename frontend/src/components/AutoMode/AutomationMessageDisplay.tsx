import React from 'react';
import { AutomationMessage } from '@/types/automation';

interface AutomationMessageProps {
	message: AutomationMessage | null;
}

const AutomationMessageDisplay: React.FC<AutomationMessageProps> = ({ message }) => {
	if (!message) return null;

	return (
		<div className={`message ${message.type}`}>
			{message.text}
		</div>
	);
};

export default AutomationMessageDisplay;
