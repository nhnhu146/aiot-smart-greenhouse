import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'react-bootstrap';
import DeviceControlCard from './components/DeviceControlCard';
import HighlightWrapper from '@/components/Common/HighlightWrapper';
import { DeviceStates, deviceStateService } from '@/services/deviceStateService';
import { useDeviceSync } from '@/hooks/useDeviceSync';
import './DeviceControlCenter.css';

interface Activity {
	title: string;
	icon: string;
	device: string;
	description: string;
}

interface DeviceControlCenterProps {
	activities: Activity[];
	switchStates?: Map<string, boolean>; // Legacy prop - now managed internally
	onDeviceToggle?: (device: string) => void; // Legacy prop - now managed internally
	voiceCommandTrigger?: any;
}

const DeviceControlCenter: React.FC<DeviceControlCenterProps> = ({
	activities,
	voiceCommandTrigger
}) => {
	const [deviceStates, setDeviceStates] = useState<DeviceStates>({});
	const [loadingStates, setLoadingStates] = useState(new Map<string, boolean>());

	// Use enhanced device sync hook
	const { forceRefresh } = useDeviceSync({
		onStatesSync: (states) => {
			setDeviceStates(states);
		},
		onStateUpdate: (update) => {
			setDeviceStates(prev => ({
				...prev,
				[update.deviceType]: {
					status: update.status,
					isOnline: update.isOnline,
					lastCommand: update.lastCommand,
					updatedAt: update.updatedAt
				}
			}));

		},
		autoSync: true
	});

	// Fetch initial device states on mount
	useEffect(() => {
		fetchDeviceStates();
	}, []);

	// Manual sync function that uses the enhanced service
	const fetchDeviceStates = useCallback(async () => {
		try {
			const states = await deviceStateService.getAllStates();
			setDeviceStates(states);
		} catch (error) {
			console.error('Failed to fetch device states:', error);
		}
	}, []);

	const handleDeviceToggle = useCallback(async (device: string) => {
		// Set loading state
		setLoadingStates(prev => new Map(prev.set(device, true)));

		try {
			const currentState = deviceStates[device]?.status || false;
			const newState = !currentState;
			const action = newState ? 'on' : 'off';

			// 1.1. Send API to backend (following Dataflow.md)
			const response = await fetch('/api/devices/control', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					deviceType: device,
					action: action
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			// Backend handles:
			// 1.1.1. Backend update history
			// 1.1.2. Backend send MQTT message to IoT
			// 1.1.3. Backend send Web Socket to notice other clients update status
			
			// 1.2. Frontend receives WebSocket updates via useDeviceSync hook
			// No manual state updates needed - WebSocket will handle it

			console.log(`✅ Device control sent: ${device} -> ${action}`);

		} catch (error) {
			console.error(`❌ Error controlling device ${device}:`, error);

			// Force refresh to get accurate state from backend
			await forceRefresh();
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
	}, [deviceStates, forceRefresh]);;

	const getDeviceStatus = (device: string): boolean => {
		return deviceStates[device]?.status || false;
	};

	return (
		<div className="device-control-center">
			<div className="device-control-header">
				<h2>Device Control Center</h2>
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
								isActive={getDeviceStatus(activity.device)}
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
