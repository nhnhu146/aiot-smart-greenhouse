import React, { useState } from 'react';
import { Card } from 'react-bootstrap';
import styles from './ActivityCard.module.scss';

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
			console.log(`[ActivityCard] Clicked: ${title}, current: ${localActive}, new: ${newState}`);
		}
	};

	// Sync local state with prop when prop changes
	React.useEffect(() => {
		setLocalActive(switchState);
	}, [switchState]);

	return (
		<Card
			className={`${styles.card} ${localActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
			onClick={handleCardClick}
			style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
		>
			<Card.Body className={styles.cardBody}>
				<div className={styles.icon}>{icon}</div>
				<div className={styles.title}>
					{title}
					{disabled && <small className="text-muted d-block">Auto Mode Active</small>}
				</div>
			</Card.Body>
		</Card>
	);
};

export default ActivityCard;
