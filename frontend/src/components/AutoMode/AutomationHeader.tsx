import React from 'react';

interface AutomationHeaderProps {
	autoMode: boolean;
	isAnyActionInProgress: boolean;
	onToggle: () => void;
}

const AutomationHeader: React.FC<AutomationHeaderProps> = ({
	autoMode,
	isAnyActionInProgress,
	onToggle
}) => {
	return (
		<div className="automode-header">
			<h1>⚙️ Automation Settings</h1>
			<div className="main-toggle">
				<span className={`status-text ${autoMode ? 'enabled' : 'disabled'}`}>
					{autoMode ? 'AUTOMATION ENABLED' : 'AUTOMATION DISABLED'}
				</span>
				<label className="switch">
					<input
						type="checkbox"
						checked={autoMode}
						onChange={onToggle}
						disabled={isAnyActionInProgress}
					/>
					<span className="slider round"></span>
				</label>
			</div>
		</div>
	);
};

export default AutomationHeader;
