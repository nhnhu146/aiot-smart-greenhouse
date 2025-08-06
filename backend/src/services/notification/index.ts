import { EmailNotifier } from './EmailNotifier';
import { PushNotifier } from './PushNotifier';
import { NotificationQueue } from './NotificationQueue';
import { AlertDatabaseHandler, AlertData } from './AlertDatabaseHandler';
/**
 * Notification Service - Orchestrates all notification types
 * Main service that coordinates email, push, and database operations
 */

export class NotificationService {
	private emailNotifier: EmailNotifier;
	private pushNotifier: PushNotifier;
	private queue: NotificationQueue;
	private dbHandler: AlertDatabaseHandler;
	constructor() {
		this.emailNotifier = new EmailNotifier();
		this.pushNotifier = new PushNotifier();
		this.queue = new NotificationQueue();
		this.dbHandler = new AlertDatabaseHandler();
	}

	/**
	 * Main alert trigger - coordinates all notification types
	 */
	async triggerAlert(alertData: AlertData): Promise<void> {
		const requestId = Math.random().toString(36).substr(2, 9);
		console.log(`[${requestId}] Alert triggered:`, alertData);
		try {
			// Generate alert key for cooldown
			const alertKey = this.queue.generateAlertKey(
				alertData.type,
				alertData.level,
				alertData.currentValue
			);
			// Check cooldown
			if (!this.queue.shouldSendAlert(alertKey)) {
				return;
			}

			// Mark as sent immediately to prevent concurrent triggers
			this.queue.markAlertSent(alertKey);
			// Save to database
			try {
				await this.dbHandler.saveAlert(alertData);
				console.log(`[${requestId}] Alert saved to database`);
			} catch (dbError) {
				console.error(`[${requestId}] Database save failed:`, dbError);
			}

			// Get recipients and settings
			const recipients = await this.dbHandler.getEmailRecipients();
			const settings = await this.dbHandler.getAlertSettings();
			// Send email notification
			if (settings.emailEnabled && recipients.length > 0) {
				try {
					this.emailNotifier.setRecipients(recipients);
					const subject = `🌿 Greenhouse Alert: ${alertData.type.toUpperCase()}`;
					const html = this.generateEmailHTML(alertData);
					await this.emailNotifier.sendEmail(subject, html, recipients);
					console.log(`[${requestId}] Email sent to ${recipients.length} recipients`);
				} catch (emailError) {
					console.error(`[${requestId}] Email failed:`, emailError);
				}
			}

			// Send push notification
			try {
				await this.pushNotifier.sendPush({
					title: `🌿 Alert: ${alertData.type.toUpperCase()} - ${alertData.level.toUpperCase()}`,
					message: alertData.message,
					priority: alertData.level === 'critical' ? 'high' : 'normal'
				});
				console.log(`[${requestId}] Push notification sent`);
			} catch (pushError) {
				console.error(`[${requestId}] Push notification failed:`, pushError);
			}

		} catch (error) {
			console.error(`[${requestId}] Alert processing failed:`, error);
		}
	}

	/**
	 * Generate HTML content for email alerts
	 */
	private generateEmailHTML(alertData: AlertData): string {
		const levelEmoji = {
			low: '🟡',
			medium: '🟠',
			high: '🔴',
			critical: '🚨'
		};
		return `
			<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
				<h2 style='color: #2b512b;'>${levelEmoji[alertData.level]} Greenhouse Alert</h2>
				<div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
					<h3>Alert Details</h3>
					<p><strong>Type:</strong> ${alertData.type}</p>
					<p><strong>Level:</strong> ${alertData.level.toUpperCase()}</p>
					<p><strong>Message:</strong> ${alertData.message}</p>
					${alertData.currentValue ? `<p><strong>Current Value:</strong> ${alertData.currentValue}</p>` : ''}
					${alertData.threshold ? `<p><strong>Threshold:</strong> ${alertData.threshold.min || 'N/A'} - ${alertData.threshold.max || 'N/A'}</p>` : ''}
					<p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
				</div>
				<p style='color: #666;'>This is an automated alert from your AIoT Smart Greenhouse system.</p>
			</div>
		`;
	}

	/**
	 * Test all notification services
	 */
	async testNotifications(): Promise<{ email: boolean; push: boolean }> {
		const results = {
			email: false,
			push: false
		};
		try {
			results.email = await this.emailNotifier.testEmail();
		} catch (error) {
			console.error('Email test failed:', error);
		}

		try {
			results.push = await this.pushNotifier.testPush();
		} catch (error) {
			console.error('Push test failed:', error);
		}

		return results;
	}

	/**
	 * Get notification service status
	 */
	getStatus(): any {
		return {
			email: this.emailNotifier.getStatus(),
			push: this.pushNotifier.getStatus(),
			queue: this.queue.getCooldownStatus()
		};
	}

	/**
	 * Update notification settings
	 */
	async updateSettings(cooldownMinutes?: number): Promise<void> {
		if (cooldownMinutes) {
			this.queue.setCooldown(cooldownMinutes);
		}
	}
}

// Export singleton instance
export const notificationService = new NotificationService();
// Export types
export type { AlertData };