import React from 'react';
import './StatusIndicators.css';

interface StatusIndicatorsProps {
	isConnected: boolean;
	unsavedCount: number;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
	isConnected,
	unsavedCount
}) => {
	return (
		<div className="status-indicators">
			<div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
				{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
			</div>
			{unsavedCount > 0 && (
				<div className="unsaved-warning">
					⚠️ {unsavedCount} Unsaved value{unsavedCount > 1 ? 's' : ''}
				</div>
			)}
		</div>
	);
};

export default StatusIndicators;
