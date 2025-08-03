import React from 'react';
import { PumpThresholds } from '@/types/automation';

interface PumpThresholdCardProps {
	pumpThresholds: PumpThresholds;
	isAnyActionInProgress: boolean;
	onInputChange: (field: string, value: any, parentField: string) => void;
}

const PumpThresholdCard: React.FC<PumpThresholdCardProps> = ({
	pumpThresholds,
	isAnyActionInProgress,
	onInputChange
}) => {
	return (
		<div className="settings-card">
			<h3>💧 Pump Thresholds</h3>

			<div className="input-group">
				<label>Turn on when dry (0-1):</label>
				<select
					value={pumpThresholds.turnOnWhenDry}
					onChange={(e) => onInputChange('turnOnWhenDry', parseFloat(e.target.value), 'pumpThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Very Dry</option>
					<option value={0.1}>0.1 - Dry</option>
					<option value={0.2}>0.2 - Low Moisture</option>
					<option value={0.3}>0.3 - Below Normal</option>
					<option value={0.4}>0.4 - Moderate Low</option>
					<option value={0.5}>0.5 - Medium</option>
					<option value={0.6}>0.6 - Moderate High</option>
					<option value={0.7}>0.7 - Moist</option>
					<option value={0.8}>0.8 - Very Moist</option>
					<option value={0.9}>0.9 - Nearly Wet</option>
					<option value={1}>1 - Fully Wet</option>
				</select>
			</div>

			<div className="input-group">
				<label>Turn off when wet (0-1):</label>
				<select
					value={pumpThresholds.turnOffWhenWet}
					onChange={(e) => onInputChange('turnOffWhenWet', parseFloat(e.target.value), 'pumpThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Very Dry</option>
					<option value={0.1}>0.1 - Dry</option>
					<option value={0.2}>0.2 - Low Moisture</option>
					<option value={0.3}>0.3 - Below Normal</option>
					<option value={0.4}>0.4 - Moderate Low</option>
					<option value={0.5}>0.5 - Medium</option>
					<option value={0.6}>0.6 - Moderate High</option>
					<option value={0.7}>0.7 - Moist</option>
					<option value={0.8}>0.8 - Very Moist</option>
					<option value={0.9}>0.9 - Nearly Wet</option>
					<option value={1}>1 - Fully Wet</option>
				</select>
			</div>
		</div>
	);
};

export default PumpThresholdCard;
