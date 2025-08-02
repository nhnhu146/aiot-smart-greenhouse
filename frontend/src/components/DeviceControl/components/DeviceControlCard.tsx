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
    description,
    isActive,
    isLoading = false,
    onToggle,
    trigger
}) => {
    return (
        <HighlightWrapper trigger={trigger} className="device-card-highlight">
            <div className={`device-card ${isActive ? 'active' : ''}`}>
                <div className="device-header">
                    <div className="device-icon">{icon}</div>
                    <div className="device-info">
                        <h3 className="device-title">{title}</h3>
                        <p className="device-description">{description}</p>
                    </div>
                </div>
                <div className="device-controls">
                    <button
                        className={`device-toggle ${isActive ? 'on' : 'off'}`}
                        onClick={onToggle}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span>...</span>
                        ) : (
                            <span>{isActive ? 'ON' : 'OFF'}</span>
                        )}
                    </button>
                </div>
            </div>
        </HighlightWrapper>
    );
};

export default DeviceControlCard;
