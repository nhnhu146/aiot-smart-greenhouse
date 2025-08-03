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
				<label>Turn on when dark (Binary):</label>
				<select
					value={lightThresholds.turnOnWhenDark}
					onChange={(e) => onInputChange('turnOnWhenDark', parseFloat(e.target.value), 'lightThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Dark (Turn ON light)</option>
					<option value={1}>1 - Bright (Keep OFF)</option>
				</select>
			</div>

			<div className="input-group">
				<label>Turn off when bright (Binary):</label>
				<select
					value={lightThresholds.turnOffWhenBright}
					onChange={(e) => onInputChange('turnOffWhenBright', parseFloat(e.target.value), 'lightThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Dark (Keep ON)</option>
					<option value={1}>1 - Bright (Turn OFF light)</option>
				</select>
			</div>
		</div>
	);
};

export default LightThresholdCard;
