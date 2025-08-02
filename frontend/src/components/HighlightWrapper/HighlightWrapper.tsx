import React, { useState, useEffect } from 'react';

interface HighlightWrapperProps {
	children: React.ReactNode;
	trigger?: any; // Value that triggers highlight when changed
	className?: string;
	highlightDuration?: number;
}

const HighlightWrapper: React.FC<HighlightWrapperProps> = ({
	children,
	trigger,
	className = '',
	highlightDuration = 2000
}) => {
	const [isHighlighted, setIsHighlighted] = useState(false);
	const [previousTrigger, setPreviousTrigger] = useState(trigger);

	useEffect(() => {
		// Only highlight if trigger value actually changed and is not initial value
		if (trigger !== undefined && trigger !== previousTrigger && previousTrigger !== undefined) {
			setIsHighlighted(true);

			const timer = setTimeout(() => {
				setIsHighlighted(false);
			}, highlightDuration);

			return () => clearTimeout(timer);
		}

		setPreviousTrigger(trigger);
	}, [trigger, previousTrigger, highlightDuration]);

	return (
		<div className={`${className} ${isHighlighted ? 'highlight-update' : ''}`}>
			{children}
		</div>
	);
};

export default HighlightWrapper;
