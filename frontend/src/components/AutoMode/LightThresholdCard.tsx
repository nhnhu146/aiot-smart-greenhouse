import React from 'react';
import { LightThresholds } from '@/types/automation';

interface LightThresholdCardProps {
	lightThresholds: LightThresholds;
	isAnyActionInProgress: boolean;
	onInputChange: (field: string, value: any, parentField: string) => void;
}

const LightThresholdCard: React.FC<LightThresholdCardProps> = ({
	lightThresholds,
	isAnyActionInProgress,
	onInputChange
}) => {
	return (
		<div className="settings-card">
			<h3>💡 Light Thresholds</h3>

			<div className="input-group">
				<label>Turn on when dark (0-1):</label>
				<input
					type="number"
					min="0"
					max="1"
					step="0.1"
					value={lightThresholds.turnOnWhenDark}
					onChange={(e) => onInputChange('turnOnWhenDark', parseFloat(e.target.value), 'lightThresholds')}
					disabled={isAnyActionInProgress}
				/>
			</div>

			<div className="input-group">
				<label>Turn off when bright (0-1):</label>
				<input
					type="number"
					min="0"
					max="1"
					step="0.1"
					value={lightThresholds.turnOffWhenBright}
					onChange={(e) => onInputChange('turnOffWhenBright', parseFloat(e.target.value), 'lightThresholds')}
					disabled={isAnyActionInProgress}
				/>
			</div>
		</div>
	);
};

export default LightThresholdCard;
