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
				<select
					value={lightThresholds.turnOnWhenDark}
					onChange={(e) => onInputChange('turnOnWhenDark', parseFloat(e.target.value), 'lightThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Dark</option>
					<option value={0.1}>0.1 - Very Low Light</option>
					<option value={0.2}>0.2 - Low Light</option>
					<option value={0.3}>0.3 - Dim Light</option>
					<option value={0.4}>0.4 - Moderate Low</option>
					<option value={0.5}>0.5 - Medium</option>
					<option value={0.6}>0.6 - Moderate High</option>
					<option value={0.7}>0.7 - Bright</option>
					<option value={0.8}>0.8 - Very Bright</option>
					<option value={0.9}>0.9 - Very High</option>
					<option value={1}>1 - Maximum Light</option>
				</select>
			</div>

			<div className="input-group">
				<label>Turn off when bright (0-1):</label>
				<select
					value={lightThresholds.turnOffWhenBright}
					onChange={(e) => onInputChange('turnOffWhenBright', parseFloat(e.target.value), 'lightThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Dark</option>
					<option value={0.1}>0.1 - Very Low Light</option>
					<option value={0.2}>0.2 - Low Light</option>
					<option value={0.3}>0.3 - Dim Light</option>
					<option value={0.4}>0.4 - Moderate Low</option>
					<option value={0.5}>0.5 - Medium</option>
					<option value={0.6}>0.6 - Moderate High</option>
					<option value={0.7}>0.7 - Bright</option>
					<option value={0.8}>0.8 - Very Bright</option>
					<option value={0.9}>0.9 - Very High</option>
					<option value={1}>1 - Maximum Light</option>
				</select>
			</div>
		</div>
	);
};

export default LightThresholdCard;
