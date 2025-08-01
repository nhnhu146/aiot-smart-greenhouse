import React, { useState } from 'react';
import './ActivityCard.css';

type ActivityCardProps = {
	title: string;
	icon: string;
	switchId: string;
	switchState: boolean;
	onSwitchChange?: (state: boolean) => void;
	disabled?: boolean;
};

const ActivityCard: React.FC<ActivityCardProps> = ({ title, icon, switchState, onSwitchChange, disabled = false }) => {
	// Local UI state for immediate response
	const [localActive, setLocalActive] = useState(switchState);

	const handleCardClick = () => {
		if (disabled) return; // Don't allow clicks when disabled

		const newState = !localActive;
		// Update UI immediately
		setLocalActive(newState);
		if (onSwitchChange) {
			// Call callback to update actual state with the new state
			onSwitchChange(newState);
		}
	};

	// Sync local state with prop when prop changes
	React.useEffect(() => {
		setLocalActive(switchState);
	}, [switchState]);

	return (
		<div
			className={`activity-card ${localActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
			onClick={handleCardClick}
			style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
		>
			<div className="activity-card-body">
				<div className="activity-icon">{icon}</div>
				<div className="activity-title">
					{title}
					{disabled && <small className="auto-mode-text">Auto Mode Active</small>}
				</div>
			</div>
		</div>
	);
};

export default ActivityCard;
