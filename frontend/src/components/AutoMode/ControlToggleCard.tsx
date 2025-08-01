import React from 'react';
import { AutomationSettings } from '@/types/automation';

interface ControlToggleCardProps {
	settings: AutomationSettings;
	isAnyActionInProgress: boolean;
	onInputChange: (field: string, value: any) => void;
}

const ControlToggleCard: React.FC<ControlToggleCardProps> = ({
	settings,
	isAnyActionInProgress,
	onInputChange
}) => {
	return (
		<div className="settings-card">
			<h3>🎛️ Device Control Settings</h3>

			<div className="control-item">
				<label>
					<input
						type="checkbox"
						checked={settings.lightControlEnabled}
						onChange={(e) => onInputChange('lightControlEnabled', e.target.checked)}
						disabled={isAnyActionInProgress}
					/>
					💡 Light Control
				</label>
			</div>

			<div className="control-item">
				<label>
					<input
						type="checkbox"
						checked={settings.pumpControlEnabled}
						onChange={(e) => onInputChange('pumpControlEnabled', e.target.checked)}
						disabled={isAnyActionInProgress}
					/>
					💧 Pump Control
				</label>
			</div>

			<div className="control-item">
				<label>
					<input
						type="checkbox"
						checked={settings.windowControlEnabled}
						onChange={(e) => onInputChange('windowControlEnabled', e.target.checked)}
						disabled={isAnyActionInProgress}
					/>
					🪟 Window Control
				</label>
			</div>
		</div>
	);
};

export default ControlToggleCard;
