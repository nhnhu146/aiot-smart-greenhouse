import React from 'react';
import { Alert } from 'react-bootstrap';

interface DashboardAlertsProps {
	isConnected: boolean;
	autoMode: boolean;
	userInteraction: boolean;
}

const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
	isConnected,
	autoMode,
	userInteraction
}) => {
	return (
		<>
			{!isConnected && (
				<Alert variant="warning" className="mb-3">
					⚠️ WebSocket disconnected. Device control may not work properly.
				</Alert>
			)}

			{/* Automation Status */}
			{autoMode && !userInteraction && (
				<Alert variant="info" className="mb-0">
					🤖 <strong>Automation Active:</strong> Devices are being controlled automatically based on sensor readings.
					<br />
					<small>
						• Light: ON when light level = 0 (dark) |
						• Pump: ON when soil moisture = 0 (dry) |
						• Devices controlled automatically
					</small>
				</Alert>
			)}

			{userInteraction && (
				<Alert variant="warning" className="mb-0">
					👋 <strong>Manual Control:</strong> User interaction detected. Automation will resume in 5 minutes.
				</Alert>
			)}

			{!autoMode && (
				<Alert variant="secondary" className="mb-0">
					⏸️ <strong>Auto Mode Disabled:</strong> All devices are under manual control.
				</Alert>
			)}
		</>
	);
};

export default DashboardAlerts;
