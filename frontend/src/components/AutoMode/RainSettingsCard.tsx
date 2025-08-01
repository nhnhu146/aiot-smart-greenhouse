import React from 'react';
import { RainSettings } from '@/types/automation';

interface RainSettingsCardProps {
	rainSettings: RainSettings;
	isAnyActionInProgress: boolean;
	onInputChange: (field: string, value: any, parentField: string) => void;
}

const RainSettingsCard: React.FC<RainSettingsCardProps> = ({
	rainSettings,
	isAnyActionInProgress,
	onInputChange
}) => {
	return (
		<div className="settings-card">
			<h3>🌧️ Rain Protection</h3>

			<div className="control-item">
				<label>
					<input
						type="checkbox"
						checked={rainSettings.autoCloseWindowOnRain}
						onChange={(e) => onInputChange('autoCloseWindowOnRain', e.target.checked, 'rainSettings')}
						disabled={isAnyActionInProgress}
					/>
					🌧️ Close window on rain
				</label>
			</div>

			<div className="control-item">
				<label>
					<input
						type="checkbox"
						checked={rainSettings.autoOpenAfterRain}
						onChange={(e) => onInputChange('autoOpenAfterRain', e.target.checked, 'rainSettings')}
						disabled={isAnyActionInProgress}
					/>
					☀️ Open window after rain
				</label>
			</div>
		</div>
	);
};

export default RainSettingsCard;
