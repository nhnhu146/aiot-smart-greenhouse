import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import DeviceControlCard from './components/DeviceControlCard';
import StatusIndicators from './components/StatusIndicators';
import HighlightWrapper from '@/components/Common/HighlightWrapper';
import { deviceStateService, DeviceStates } from '@/services/deviceStateService';
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
	const { isConnected, socket } = useWebSocketContext();
	const [deviceStates, setDeviceStates] = useState<DeviceStates>({});
	const [loadingStates, setLoadingStates] = useState(new Map<string, boolean>());
	const [unsavedStates, setUnsavedStates] = useState(new Set<string>());

	// Fetch initial device states on mount
	useEffect(() => {
		fetchDeviceStates();
	}, []);

	// Listen for device state updates via WebSocket
	useEffect(() => {
		if (!socket) return;

		const handleDeviceStateUpdate = (data: any) => {
			console.log('📡 Received device state update:', data);

			setDeviceStates(prev => ({
				...prev,
				[data.deviceType]: {
					status: data.status,
					isOnline: data.isOnline,
					lastCommand: data.lastCommand,
					updatedAt: data.updatedAt
				}
			}));

			// Clear unsaved state if this was a remote update
			setUnsavedStates(prev => {
				const newSet = new Set(prev);
				newSet.delete(data.deviceType);
				return newSet;
			});
		};

		socket.on('device:state-update', handleDeviceStateUpdate);
		socket.on('device:status', handleDeviceStateUpdate); // Legacy compatibility

		// Listen for individual device updates
		activities.forEach(activity => {
			socket.on(`device:${activity.device}:state`, handleDeviceStateUpdate);
		});

		return () => {
			socket.off('device:state-update', handleDeviceStateUpdate);
			socket.off('device:status', handleDeviceStateUpdate);

			activities.forEach(activity => {
				socket.off(`device:${activity.device}:state`, handleDeviceStateUpdate);
			});
		};
	}, [socket, activities]);

	const fetchDeviceStates = useCallback(async () => {
		try {
			const states = await deviceStateService.getAllStates();
			setDeviceStates(states);
			console.log('📊 Device states loaded:', states);
		} catch (error) {
			console.error('❌ Error loading device states:', error);
		}
	}, []);

	const handleDeviceToggle = useCallback(async (device: string) => {
		// Set loading state
		setLoadingStates(prev => new Map(prev.set(device, true)));

		try {
			const currentState = deviceStates[device]?.status || false;
			const newState = !currentState;

			// Optimistically update UI
			setDeviceStates(prev => ({
				...prev,
				[device]: {
					...prev[device],
					status: newState,
					lastCommand: newState ? 'on' : 'off',
					updatedAt: new Date().toISOString()
				}
			}));

			// Mark as unsaved
			setUnsavedStates(prev => new Set(prev).add(device));

			// Call device control API (which will also send MQTT and update backend state)
			const action = newState ? 'on' : 'off';
			await fetch('/api/devices/control', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					deviceType: device,
					action: action
				})
			});

			// Update backend state explicitly
			await deviceStateService.updateDeviceState(device, newState, action);

			// Clear unsaved state after successful update
			setUnsavedStates(prev => {
				const newSet = new Set(prev);
				newSet.delete(device);
				return newSet;
			});

			console.log(`✅ Device ${device} ${action} command sent successfully`);

		} catch (error) {
			console.error(`❌ Error controlling device ${device}:`, error);

			// Revert optimistic update on error
			await fetchDeviceStates();
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
	}, [deviceStates, fetchDeviceStates]);

	const getDeviceStatus = (device: string): boolean => {
		return deviceStates[device]?.status || false;
	};

	const isDeviceUnsaved = (device: string): boolean => {
		return unsavedStates.has(device);
	};

	return (
		<div className="device-control-center">
			<div className="device-control-header">
				<h2>Device Control Center</h2>
				<StatusIndicators
					isConnected={isConnected}
					unsavedCount={unsavedStates.size}
				/>
			</div>

			<Row className="g-3">
				{activities.map((activity) => (
					<Col md={6} lg={3} key={activity.device}>
						<HighlightWrapper
							trigger={voiceCommandTrigger}
							className={`device-control-highlight ${isDeviceUnsaved(activity.device) ? 'unsaved' : ''}`}
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
							{isDeviceUnsaved(activity.device) && (
								<div className="unsaved-indicator">
									⚠️ Unsaved value
								</div>
							)}
						</HighlightWrapper>
					</Col>
				))}
			</Row>
		</div>
	);
};

export default DeviceControlCenter;
