/// <reference types="node" />
/// <reference types="node" />
import { emailService } from '../EmailService';
import { AlertConfig } from './AlertConfig';
export class AlertBatchProcessor {
	private pendingAlerts: any[] = [];
	private batchAlertTimer: ReturnType<typeof setTimeout> | null = null;
	constructor(private config: AlertConfig) {}

	addToPendingAlerts(alert: any): void {
		this.pendingAlerts.push(alert);
	}

	getPendingAlerts(): any[] {
		return this.pendingAlerts;
	}

	startBatchAlertTimer(): void {
		if (!this.config.isBatchAlertsEnabled()) {
			console.log('📧 Batch alerts disabled, skipping timer');
			return;
		}

		// Clear existing timer
		if (this.batchAlertTimer) {
			clearInterval(this.batchAlertTimer);
		}

		// Set new timer
		const intervalMs = this.config.getAlertFrequency() * 60 * 1000;
		this.batchAlertTimer = setInterval(() => {
			this.processBatchedAlerts();
		}, intervalMs);
		console.log(`⏰ Batch alert timer started: ${this.config.getAlertFrequency()} minute intervals`);
	}

	async processBatchedAlerts(): Promise<void> {
		if (this.pendingAlerts.length === 0) {
			console.log('📧 No pending alerts to process');
			return;
		}

		try {
			console.log(`📧 Processing ${this.pendingAlerts.length} batched alerts`);
			// Send batch email to all recipients
			const emailRecipients = this.config.getEmailRecipients();
			// Send batch alert email (method doesn't take parameters yet)
			await emailService.sendBatchAlertEmail();

			console.log(`📧 Batch alert email sent to ${emailRecipients.length} recipients`);
			// Clear pending alerts after sending
			this.pendingAlerts = [];
		} catch (error) {
			console.error('❌ Error processing batched alerts:', error);
		}
	}

	private groupAlertsByType(alerts: any[]) {
		const summary = {
			alerts: alerts,
			period: 'batch',
			totalAlerts: alerts.length
		};
		return summary;
	}

	stopBatchAlertTimer(): void {
		if (this.batchAlertTimer) {
			clearInterval(this.batchAlertTimer);
			this.batchAlertTimer = null;
		}
	}
}
