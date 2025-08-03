import { DeviceHistory } from '../../models';
import { mqttService, webSocketService } from '../index';
import logger from '../../utils/logger';

export class DeviceController {
	async controlDevice(device: string, action: string, reason: string): Promise<void> {
		try {
			const mqttAction = this.convertToMQTTValue(action);

			// Send MQTT command
			mqttService.publishDeviceControl(device, mqttAction);

			// Save device history
			const deviceHistory = new DeviceHistory({
				deviceId: `greenhouse_${device}`,
				deviceType: device,
				action: action,
				status: action === 'on' || action === 'open',
				controlType: 'auto',
				timestamp: new Date(),
				triggeredBy: reason
			}); await deviceHistory.save();

			// Broadcast device control to WebSocket clients
			webSocketService.broadcastDeviceControl({
				controlId: `auto_${device}_${Date.now()}`,
				deviceType: device,
				action: action,
				status: action === 'on' || action === 'open',
				source: 'automation',
				timestamp: new Date().toISOString(),
				success: true
			});

			console.log(`🤖 [AUTO] ${device.toUpperCase()} ${action.toUpperCase()} | Reason: ${reason}`);

		} catch (error) {
			console.error(`❌ Failed to control ${device}:`, error);
			logger.error(`Device control failed: ${device} ${action}`, error);
			throw error;
		}
	}

	private convertToMQTTValue(action: string): string {
		switch (action.toLowerCase()) {
			case 'on':
			case 'open':
				return '1';
			case 'off':
			case 'close':
				return '0';
			default:
				return action;
		}
	}
}
