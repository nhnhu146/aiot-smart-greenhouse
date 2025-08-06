import { notificationService } from '../NotificationService';
import { emailService, AlertEmailData } from '../EmailService';
import { AlertConfig } from './AlertConfig';
export class SystemErrorHandler {
	constructor(private config: AlertConfig, private pendingAlerts: any[]) {}

	async handleSystemError(error: string, component: string): Promise<void> {
		try {
			await notificationService.triggerAlert({
				type: 'system',
				level: 'critical',
				message: `System error in ${component}: ${error}`,
				currentValue: 0,
				threshold: { min: 0, max: 0 }
			});
			const emailRecipients = this.config.getEmailRecipients();
			if (emailRecipients.length > 0) {
				const alert = {
					type: 'system',
					level: 'critical',
					message: `System error in ${component}: ${error}`,
					currentValue: 0,
					threshold: { min: 0, max: 0 },
					timestamp: new Date().toISOString()
				};
				if (this.config.isBatchAlertsEnabled()) {
					this.pendingAlerts.push(alert);
					console.log(`🔄 System error alert added to batch (${this.pendingAlerts.length} pending)`);
				} else {
					for (const recipient of emailRecipients) {
						const alertData: AlertEmailData = {
							alertType: 'System Error',
							deviceType: 'System Error',
							currentValue: 0,
							threshold: 0,
							timestamp: new Date().toISOString(),
							severity: 'critical'
						};
						await emailService.sendAlertEmail(alertData, [recipient]);
					}
				}
			}
		} catch (error) {
			console.error('Error handling system error alert:', error);
		}
	}

	async testEmailAlert(): Promise<boolean> {
		const emailRecipients = this.config.getEmailRecipients();
		if (emailRecipients.length === 0) {
			console.log('No email recipients configured for testing');
			return false;
		}

		for (const recipient of emailRecipients) {
			await emailService.sendTestEmail(recipient);
		}
		return true;
	}

	getEmailStatus(): { enabled: boolean; configured: boolean; recipients: number } {
		const status = emailService.getStatus();
		return {
			enabled: status.configured,
			configured: status.configured,
			recipients: this.config.getEmailRecipients().length
		};
	}
}
