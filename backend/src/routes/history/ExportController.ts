import { Request, Response } from 'express';
import { SensorExportController } from './SensorExportController';
import { DeviceVoiceExportController } from './DeviceVoiceExportController';
import { CompleteExportController } from './CompleteExportController';

export class ExportController {
	private sensorExportController = new SensorExportController();
	private deviceVoiceExportController = new DeviceVoiceExportController();
	private completeExportController = new CompleteExportController();

	async exportSensorData(req: Request, res: Response): Promise<void> {
		return this.sensorExportController.exportSensorData(req, res);
	}

	async exportDeviceControls(req: Request, res: Response): Promise<void> {
		return this.deviceVoiceExportController.exportDeviceControls(req, res);
	}

	async exportVoiceCommands(req: Request, res: Response): Promise<void> {
		return this.deviceVoiceExportController.exportVoiceCommands(req, res);
	}

	async exportAllData(req: Request, res: Response): Promise<void> {
		return this.completeExportController.exportAllData(req, res);
	}
}
