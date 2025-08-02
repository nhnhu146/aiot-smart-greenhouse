import React from 'react';
import HighlightWrapper from '@/components/Common/HighlightWrapper';
import './DeviceControlCard.css';

interface DeviceControlCardProps {
	title: string;
	icon: string;
	description: string;
	isActive: boolean;
	isLoading?: boolean;
	onToggle: () => void;
	trigger?: any;
}

const DeviceControlCard: React.FC<DeviceControlCardProps> = ({
	title,
	icon,
	isActive,
	isLoading = false,
	onToggle,
	trigger
}) => {
	return (
		<HighlightWrapper trigger={trigger} className="device-card-highlight">
			<button
				className={`device-card clickable ${isActive ? 'active' : ''}`}
				onClick={onToggle}
				disabled={isLoading}
				style={{
					background: 'none',
					border: 'none',
					padding: '0',
					width: '100%',
					textAlign: 'left',
					cursor: isLoading ? 'not-allowed' : 'pointer'
				}}
			>
				<div className="device-header">
					<div className="device-icon">{icon}</div>
					<div className="device-info">
						<h3 className="device-title">{title}</h3>
						<div className="device-status">
							{isLoading ? (
								<span className="status-loading">Processing...</span>
							) : (
								<span className={`status-text ${isActive ? 'on' : 'off'}`}>
									{isActive ? '🟢 ON' : '🔴 OFF'}
								</span>
							)}
						</div>
					</div>
				</div>
			</button>
		</HighlightWrapper>
	);
};

export default DeviceControlCard;
