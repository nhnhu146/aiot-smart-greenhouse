import React from 'react';

interface AutomationActionsProps {
	isAnyActionInProgress: boolean;
	saving: boolean;
	reloading: boolean;
	runningCheck: boolean;
	resetting: boolean;
	onSave: () => void;
	onReload: () => void;
	onRunCheck: () => void;
	onReset: () => void;
}

const AutomationActions: React.FC<AutomationActionsProps> = ({
	isAnyActionInProgress,
	saving,
	reloading,
	runningCheck,
	resetting,
	onSave,
	onReload,
	onRunCheck,
	onReset
}) => {
	return (
		<div className="action-buttons">
			<button
				onClick={onSave}
				disabled={isAnyActionInProgress}
				className="save-btn"
			>
				{saving ? 'Saving...' : 'Save Settings'}
			</button>

			<button
				onClick={onReload}
				disabled={isAnyActionInProgress}
				className="reload-btn"
			>
				{reloading ? 'Reloading...' : 'Reload Settings'}
			</button>

			<button
				onClick={onRunCheck}
				disabled={isAnyActionInProgress}
				className="run-check-btn"
			>
				{runningCheck ? 'Running Check...' : '🔍 Run Check'}
			</button>

			<button
				onClick={onReset}
				disabled={isAnyActionInProgress}
				className="reset-btn"
			>
				{resetting ? 'Resetting...' : 'Reset to Defaults'}
			</button>
		</div>
	);
};

export default AutomationActions;
