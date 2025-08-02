import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import DeviceControlCard from './components/DeviceControlCard';
import HighlightWrapper from '@/components/Common/HighlightWrapper';
import './DeviceControlCenter.css';

interface Activity {
	title: string;
	icon: string;
	device: string;
	description: string;
}

interface DeviceControlCenterProps {
	activities: Activity[];
	switchStates: Map<string, boolean>;
	onDeviceToggle: (device: string) => void;
	voiceCommandTrigger?: any;
}

const DeviceControlCenter: React.FC<DeviceControlCenterProps> = ({
	activities,
	switchStates,
	onDeviceToggle,
	voiceCommandTrigger
}) => {
	const { isConnected } = useWebSocketContext();
	const [loadingStates, setLoadingStates] = useState(new Map<string, boolean>());

	const handleDeviceToggle = async (device: string) => {
		// Set loading state
		setLoadingStates(prev => new Map(prev.set(device, true)));

		try {
			await onDeviceToggle(device);
		} finally {
			// Clear loading state after a delay
			setTimeout(() => {
				setLoadingStates(prev => {
					const newStates = new Map(prev);
					newStates.delete(device);
					return newStates;
				});
			}, 1000);
		}
	};

	return (
		<div className="device-control-center">
			<div className="device-control-header">
				<h2>Device Control Center</h2>
				<div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
					{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
				</div>
			</div>

			<Row className="g-3">
				{activities.map((activity) => (
					<Col md={6} lg={3} key={activity.device}>
						<HighlightWrapper
							trigger={voiceCommandTrigger}
							className="device-control-highlight"
						>
							<DeviceControlCard
								title={activity.title}
								icon={activity.icon}
								description={activity.description}
								isActive={switchStates.get(activity.device) || false}
								isLoading={loadingStates.get(activity.device) || false}
								onToggle={() => handleDeviceToggle(activity.device)}
								trigger={voiceCommandTrigger}
							/>
						</HighlightWrapper>
					</Col>
				))}
			</Row>
		</div>
	);
};

export default DeviceControlCenter;
