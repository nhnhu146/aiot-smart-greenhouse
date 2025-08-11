import { EmailTransporter } from './email/EmailTransporter';
import { TemplateLoader } from './email/TemplateLoader';
import { EmailSender } from './email/EmailSender';

// Time zone utility for UTC+7 (Vietnam)
const formatTimestamp = (timestamp: string | Date | number): string => {
	const date = new Date(timestamp);
	const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
	return vietnamTime.toLocaleString('vi-VN', {
		timeZone: 'Asia/Ho_Chi_Minh',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
};

// Safely convert values to string, handling null/undefined/objects
const safeValueToString = (value: any, defaultValue: string = 'N/A'): string => {
	if (value === null || value === undefined) {
		return defaultValue;
	}
	
	if (typeof value === 'object') {
		// Handle objects by extracting useful information
		if (value.hasOwnProperty('value')) {
			return safeValueToString(value.value, defaultValue);
		}
		if (value.hasOwnProperty('threshold')) {
			return safeValueToString(value.threshold, defaultValue);
		}
		if (value.hasOwnProperty('min') && value.hasOwnProperty('max')) {
			return `${value.min} - ${value.max}`;
		}
		// Convert object to JSON string as last resort
		return JSON.stringify(value);
	}
	
	if (typeof value === 'boolean') {
		return value ? 'Yes' : 'No';
	}
	
	return String(value);
};
export interface AlertEmailData {
	alertType: string
	deviceType: string
	currentValue: number | string | null | undefined
	threshold: number | string | object | null | undefined
	timestamp: string | Date | number
	severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface BatchAlertEmailData {
	alerts: AlertEmailData[]
	period: string
	totalAlerts: number
}

export class EmailService {
	private transporter: EmailTransporter;
	private templateLoader: TemplateLoader;
	private emailSender: EmailSender | null = null;
	constructor() {
		this.transporter = new EmailTransporter();
		this.templateLoader = new TemplateLoader();
		if (this.transporter.isReady() && this.transporter.getTransporter()) {
			this.emailSender = new EmailSender(this.transporter.getTransporter()!);
		}
	}

	async sendTestEmail(recipientEmail: string | string[]): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating test email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('test-email.html');
			const recipients = Array.isArray(recipientEmail) ? recipientEmail : [recipientEmail];
			const currentTime = new Date();
			const formattedTime = formatTimestamp(currentTime);
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				recipientEmail: recipients.join(', '),
				currentTime: currentTime.toISOString(),
				systemVersion: '2.1.0',
				testMessage: 'This is a test email for the Smart Greenhouse system.',
				timestamp: formattedTime,
				currentYear: currentTime.getFullYear().toString()
			});
			return await this.emailSender.sendEmail({
				to: recipients,
				subject: '✅ Smart Greenhouse - Email System Test',
				htmlContent: processedTemplate
			});
		} catch (error) {
			console.error('❌ Failed to send test email:', error);
			return false;
		}
	}

	async sendAlertEmail(alertData: AlertEmailData, recipients: string[]): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating alert email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('alert-email.html');
			const formattedTimestamp = formatTimestamp(alertData.timestamp);
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				// Map AlertEmailData properties to template variables with safe conversion
				sensorType: safeValueToString(alertData.deviceType || alertData.alertType, 'Unknown Sensor'),
				value: safeValueToString(alertData.currentValue, 'N/A'),
				threshold: safeValueToString(alertData.threshold, 'N/A'),
				timestamp: formattedTimestamp,
				currentYear: new Date().getFullYear().toString()
			});
			return await this.emailSender.sendEmail({
				to: recipients,
				subject: `🚨 Smart Greenhouse Alert - ${safeValueToString(alertData.alertType, 'System Alert')}`,
				htmlContent: processedTemplate
			});
		} catch (error) {
			console.error('❌ Failed to send alert email:', error);
			return false;
		}
	}

	async sendBatchAlertEmail(alerts?: any[], recipients?: string[]): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating batch alert email');
			return true;
		}

		if (!alerts || alerts.length === 0) {
			console.log('📧 No alerts to send in batch email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('batch-alert-email.html');
			
			// Count alerts by severity level
			const alertCounts = alerts.reduce((counts, alert) => {
				const level = alert.level || alert.severity || 'medium';
				counts[level] = (counts[level] || 0) + 1;
				return counts;
			}, { critical: 0, high: 0, medium: 0, low: 0 });

			// Prepare alert data for template with safe value conversion
			const alertSummary = alerts.map(alert => ({
				sensorType: safeValueToString(alert.deviceType || alert.type || alert.alertType, 'Unknown Sensor'),
				level: safeValueToString(alert.level || alert.severity, 'medium'),
				message: safeValueToString(alert.message, `${safeValueToString(alert.alertType, 'Alert')} detected`),
				currentValue: safeValueToString(alert.currentValue, 'N/A'),
				threshold: safeValueToString(alert.threshold, 'N/A'),
				timestamp: formatTimestamp(alert.timestamp || Date.now())
			}));

			// Generate HTML for alert items
			const alertItemsHtml = alertSummary.map(alert => `
				<div class="alert-item ${alert.level}">
					<div class="alert-header">
						<div class="alert-type">${alert.sensorType}</div>
						<div class="alert-level ${alert.level}">${alert.level}</div>
					</div>
					<div class="alert-details">
						<strong>Current Value:</strong> ${alert.currentValue}<br>
						<strong>Threshold:</strong> ${alert.threshold}<br>
						<strong>Message:</strong> ${alert.message}
					</div>
					<div class="alert-time">${alert.timestamp}</div>
				</div>
			`).join('');

			// Calculate time range with UTC+7 formatting
			const timestamps = alerts.map(alert => new Date(alert.timestamp || Date.now()).getTime());
			const earliestTime = new Date(Math.min(...timestamps));
			const latestTime = new Date(Math.max(...timestamps));
			const timeRange = `${formatTimestamp(earliestTime)} - ${formatTimestamp(latestTime)}`;

			// Generate template variables with proper formatting
			const currentTime = new Date();
			const formattedCurrentTime = formatTimestamp(currentTime);
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				alertItemsHtml: alertItemsHtml,
				alertCount: alerts.length.toString(),
				frequencyMinutes: '60', // Default frequency
				timeRange: timeRange,
				totalAlerts: alerts.length,
				criticalCount: alertCounts.critical.toString(),
				highCount: alertCounts.high.toString(),
				mediumCount: alertCounts.medium.toString(),
				lowCount: alertCounts.low.toString(),
				dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
				generatedAt: formattedCurrentTime,
				nextSummaryTime: '60', // Default next summary time
				timestamp: currentTime.toISOString()
			});

			// Use provided recipients or fallback to environment variable
			const emailRecipients = recipients || 
				process.env.EMAIL_RECIPIENTS?.split(',').map(email => email.trim()) || 
				['admin@greenhouse.com'];
			
			console.log(`📧 Sending batch alert email to: ${emailRecipients.join(', ')}`);
			console.log(`📧 Alert summary: ${alerts.length} alerts of types: ${alerts.map(a => a.type).join(', ')}`);
			
			return await this.emailSender.sendEmail({
				to: emailRecipients,
				subject: `🚨 Smart Greenhouse - ${alerts.length} Alert(s) Summary`,
				htmlContent: processedTemplate
			});
		} catch (error) {
			console.error('❌ Failed to send batch alert email:', error);
			return false;
		}
	}

	async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating password reset email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('password-reset-email.html');
			const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
			const currentTime = new Date();
			const formattedTime = formatTimestamp(currentTime);
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				resetUrl: resetUrl,
				email: email,
				expirationTime: '1 hour',
				timestamp: formattedTime
			});
			return await this.emailSender.sendEmail({
				to: email,
				subject: '🔐 Smart Greenhouse - Password Reset Request',
				htmlContent: processedTemplate
			});
		} catch (error) {
			console.error('❌ Failed to send password reset email:', error);
			return false;
		}
	}

	public async testConnection(): Promise<boolean> {
		return await this.transporter.testConnection();
	}

	public isConfigured(): boolean {
		return this.transporter.isReady();
	}

	public getStatus(): { configured: boolean; ready: boolean } {
		return {
			configured: this.transporter.isReady(),
			ready: this.transporter.isReady()
		};
	}

	public reloadTemplates(): void {
		this.templateLoader.clearCache();
		console.log('✅ Templates cache cleared');
	}
}

export default EmailService;
// Create singleton instance for backward compatibility
const emailService = new EmailService();
export { emailService };