import { EmailTransporter } from './email/EmailTransporter';
import { TemplateLoader } from './email/TemplateLoader';
import { EmailSender } from './email/EmailSender';
export interface AlertEmailData {
	alertType: string
	deviceType: string
	currentValue: number
	threshold: number
	timestamp: string
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
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				recipientEmail: recipients.join(', '),
				currentTime: new Date().toISOString(),
				systemVersion: '2.1.0'
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
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				// Map AlertEmailData properties to template variables
				sensorType: alertData.deviceType || alertData.alertType,
				value: alertData.currentValue,
				threshold: alertData.threshold,
				timestamp: alertData.timestamp,
				currentYear: new Date().getFullYear().toString(),
				recipientEmails: recipients.join(', ')
			});
			return await this.emailSender.sendEmail({
				to: recipients,
				subject: `🚨 Smart Greenhouse Alert - ${alertData.alertType}`,
				htmlContent: processedTemplate
			});
		} catch (error) {
			console.error('❌ Failed to send alert email:', error);
			return false;
		}
	}

	async sendBatchAlertEmail(): Promise<boolean> {
		// Implementation for batch alert email
		return true;
	}

	async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating password reset email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('password-reset-email.html');
			const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				resetUrl,
				email,
				expirationTime: '1 hour'
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