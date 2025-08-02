import { EmailTransporter } from './email/EmailTransporter';
import { TemplateLoader } from './email/TemplateLoader';
import { EmailSender, EmailOptions } from './email/EmailSender';

export interface AlertEmailData {
	alertType: string;
	deviceType: string;
	currentValue: number;
	threshold: number;
	timestamp: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface BatchAlertEmailData {
	alerts: AlertEmailData[];
	period: string;
	totalAlerts: number;
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

	async sendTestEmail(recipientEmail: string): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating test email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('test-email.html');
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				recipientEmail,
				currentTime: new Date().toISOString(),
				systemVersion: '2.1.0'
			});

			return await this.emailSender.sendEmail({
				to: recipientEmail,
				subject: '✅ Smart Greenhouse - Email System Test',
				htmlContent: processedTemplate
			});

		} catch (error) {
			console.error('❌ Failed to send test email:', error);
			return false;
		}
	}

	async sendAlertEmail(alertData: AlertEmailData, recipientEmails: string[]): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating alert email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('alert-email.html');
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				...alertData,
				recipientEmails: recipientEmails.join(', ')
			});

			return await this.emailSender.sendEmail({
				to: recipientEmails,
				subject: `🚨 Smart Greenhouse Alert - ${alertData.alertType}`,
				htmlContent: processedTemplate
			});

		} catch (error) {
			console.error('❌ Failed to send alert email:', error);
			return false;
		}
	}

	async sendBatchAlertEmail(batchData: BatchAlertEmailData, recipientEmails: string[]): Promise<boolean> {
		if (!this.emailSender) {
			console.log('📧 Email service not configured - simulating batch alert email');
			return true;
		}

		try {
			const template = await this.templateLoader.loadTemplate('batch-alert-email.html');
			const processedTemplate = await this.templateLoader.processTemplateWithCSS(template, {
				...batchData,
				recipientEmails: recipientEmails.join(', ')
			});

			return await this.emailSender.sendEmail({
				to: recipientEmails,
				subject: `📊 Smart Greenhouse - Alert Summary (${batchData.totalAlerts} alerts)`,
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

	public reloadTemplates(): void {
		this.templateLoader.clearCache();
		console.log('✅ Templates cache cleared');
	}
}

export default EmailService;
