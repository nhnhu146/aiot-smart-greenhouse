import React from 'react';
import { TemperatureThresholds } from '@/types/automation';

interface TemperatureThresholdCardProps {
	temperatureThresholds: TemperatureThresholds;
	isAnyActionInProgress: boolean;
	onInputChange: (field: string, value: any, parentField: string) => void;
}

const TemperatureThresholdCard: React.FC<TemperatureThresholdCardProps> = ({
	temperatureThresholds,
	isAnyActionInProgress,
	onInputChange
}) => {
	return (
		<div className="settings-card">
			<h3>🌡️ Temperature Thresholds</h3>

			<div className="input-group">
				<label>Window open temperature (°C):</label>
				<input
					type="number"
					value={temperatureThresholds.windowOpenTemp}
					onChange={(e) => onInputChange('windowOpenTemp', parseInt(e.target.value), 'temperatureThresholds')}
					disabled={isAnyActionInProgress}
				/>
			</div>

			<div className="input-group">
				<label>Window close temperature (°C):</label>
				<input
					type="number"
					value={temperatureThresholds.windowCloseTemp}
					onChange={(e) => onInputChange('windowCloseTemp', parseInt(e.target.value), 'temperatureThresholds')}
					disabled={isAnyActionInProgress}
				/>
			</div>
		</div>
	);
};

export default TemperatureThresholdCard;
