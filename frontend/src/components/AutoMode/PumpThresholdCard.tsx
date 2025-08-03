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
				<label>Turn on when dry (Binary):</label>
				<select
					value={pumpThresholds.turnOnWhenDry}
					onChange={(e) => onInputChange('turnOnWhenDry', parseFloat(e.target.value), 'pumpThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Dry (Turn ON pump)</option>
					<option value={1}>1 - Wet (Keep OFF)</option>
				</select>
			</div>

			<div className="input-group">
				<label>Turn off when wet (Binary):</label>
				<select
					value={pumpThresholds.turnOffWhenWet}
					onChange={(e) => onInputChange('turnOffWhenWet', parseFloat(e.target.value), 'pumpThresholds')}
					disabled={isAnyActionInProgress}
					className="form-control"
				>
					<option value={0}>0 - Dry (Keep ON)</option>
					<option value={1}>1 - Wet (Turn OFF pump)</option>
				</select>
			</div>
		</div>
	);
};

export default PumpThresholdCard;
