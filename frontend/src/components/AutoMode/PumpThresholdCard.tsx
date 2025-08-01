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
				<input
					type="number"
					min="0"
					max="1"
					step="0.1"
					value={pumpThresholds.turnOnWhenDry}
					onChange={(e) => onInputChange('turnOnWhenDry', parseFloat(e.target.value), 'pumpThresholds')}
					disabled={isAnyActionInProgress}
				/>
			</div>

			<div className="input-group">
				<label>Turn off when wet (0-1):</label>
				<input
					type="number"
					min="0"
					max="1"
					step="0.1"
					value={pumpThresholds.turnOffWhenWet}
					onChange={(e) => onInputChange('turnOffWhenWet', parseFloat(e.target.value), 'pumpThresholds')}
					disabled={isAnyActionInProgress}
				/>
			</div>
		</div>
	);
};

export default PumpThresholdCard;
