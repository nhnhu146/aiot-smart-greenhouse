import { Request, Response } from 'express';
import { DeviceVoiceExportController } from './DeviceVoiceExportController';
import { CompleteExportController } from './CompleteExportController';

export class ExportController {
	private deviceVoiceExportController = new DeviceVoiceExportController();
	private completeExportController = new CompleteExportController();

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