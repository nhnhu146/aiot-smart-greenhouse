
import { AlertQueryController } from './controllers/AlertQueryController';
import { AlertStatsController } from './controllers/AlertStatsController';
import { AlertManagementController } from './controllers/AlertManagementController';
export class AlertController {
	// Query methods
	static getAlerts = AlertQueryController.getAlerts;
	static getActiveAlerts = AlertQueryController.getActiveAlerts;
	// Statistics methods
	static getAlertStats = AlertStatsController.getAlertStats;
	// Management methods
	static createAlert = AlertManagementController.createAlert;
	static resolveAlert = AlertManagementController.resolveAlert;
	static unresolveAlert = AlertManagementController.unresolveAlert;
	static deleteAlert = AlertManagementController.deleteAlert;
	static resolveAllAlerts = AlertManagementController.resolveAllAlerts;
}
