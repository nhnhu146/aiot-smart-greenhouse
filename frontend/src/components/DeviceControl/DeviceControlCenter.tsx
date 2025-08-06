import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'react-bootstrap';
import DeviceControlCard from './components/DeviceControlCard';
import HighlightWrapper from '@/components/Common/HighlightWrapper';
import { DeviceStates } from '@/services/deviceStateService';
import { deviceControlService } from '@/services/deviceControlService';
import { useDeviceSync } from '@/hooks/useDeviceSync';
import './DeviceControlCenter.css';
import { AppConstants } from '../../config/AppConfig';

interface Activity {
	title: string;
	icon: string;
	device: string;
	description: string;
}

interface DeviceControlCenterProps {
	activities: Activity[];
	switchStates?: Map<string, boolean>;
	onDeviceToggle?: (device: string) => Promise<void>;
	voiceCommandTrigger?: any;
}

const DeviceControlCenter: React.FC<DeviceControlCenterProps> = ({
	activities,
	switchStates,
	onDeviceToggle,
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
		// Initial states are handled by useDeviceSync hook
		// No need for manual fetching here
	}, []);

	const handleDeviceToggle = useCallback(async (device: string) => {
		// Set loading state
		setLoadingStates(prev => new Map(prev.set(device, true)));

		try {
			const currentState = deviceStates[device]?.status || false;
			const newState = !currentState;
			
			// Map device to correct action format
			let action: 'on' | 'off' | 'open' | 'close';
			if (['light', 'pump'].includes(device)) {
				action = newState ? 'on' : 'off';
			} else if (['door', 'window'].includes(device)) {
				action = newState ? 'open' : 'close';
			} else {
				action = newState ? 'on' : 'off'; // fallback
			}

			// 1.1. Send API to backend (following Dataflow.md) using deviceControlService
			await deviceControlService.sendDeviceControl({
				deviceType: device as 'light' | 'pump' | 'door' | 'window',
				action: action
			});

			// Backend handles:
			// 1.1.1. Backend update history
			// 1.1.2. Backend send MQTT message to IoT
			// 1.1.3. Backend send Web Socket to notice other clients update status
			
			// 1.2. Frontend receives WebSocket updates via useDeviceSync hook
			// No manual state updates needed - WebSocket will handle it

			console.log(`✅ Device control sent: ${device} -> ${action}`);

			// Call optional callback if provided
			if (onDeviceToggle) {
				await onDeviceToggle(device);
			}

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
			}, AppConstants.UI.DEBOUNCE_DELAY * 3);
		}
	}, [deviceStates, forceRefresh, onDeviceToggle]);

	const getDeviceStatus = (device: string): boolean => {
		// Use switchStates if provided, otherwise use deviceStates
		if (switchStates && switchStates.has(device)) {
			return switchStates.get(device) || false;
		}
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
							/>
						</HighlightWrapper>
					</Col>
				))}
			</Row>
		</div>
	);
};

export default DeviceControlCenter;
