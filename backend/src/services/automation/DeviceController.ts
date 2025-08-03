import { mqttService, deviceStateService } from '../index';
import logger from '../../utils/logger';

export class DeviceController {
	async controlDevice(device: string, action: string, reason: string, sensorValue?: number): Promise<void> {
		try {
			const mqttAction = this.convertToMQTTValue(action);

			// Send MQTT command
			mqttService.publishDeviceControl(device, mqttAction);

			// Update device state and save history via DeviceStateService
			const status = action === 'on' || action === 'open';
			await deviceStateService.updateDeviceState(
				device,
				status,
				action,
				'automation', // source
				undefined, // userId
				reason, // triggeredBy
				sensorValue // sensorValue that triggered this action
			);

			console.log(`🤖 [AUTO] ${device.toUpperCase()} ${action.toUpperCase()} | Reason: ${reason} | Value: ${sensorValue}`);

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
