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
			const emailRecipients = this.config.getEmailRecipients();
			
			if (emailRecipients.length === 0) {
				console.warn('⚠️ No email recipients configured - batch alerts will not be sent');
				this.pendingAlerts = []; // Clear alerts to prevent buildup
				return;
			}
			
			console.log(`📧 Sending batch alert to recipients: ${emailRecipients.join(', ')}`);
			
			// Send batch alert email with recipients from config
			const emailSent = await emailService.sendBatchAlertEmail(this.pendingAlerts, emailRecipients);
			
			if (emailSent) {
				console.log(`✅ Batch alert email successfully sent to ${emailRecipients.length} recipients`);
				// Clear pending alerts after successful sending
				this.pendingAlerts = [];
			} else {
				console.error('❌ Failed to send batch alert email - alerts will be retried in next batch');
			}
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
