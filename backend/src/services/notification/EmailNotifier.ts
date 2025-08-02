import nodemailer from 'nodemailer';

/**
 * Email Notifier - Handles email configuration and sending
 * Focused on email-specific functionality
 */

export interface EmailConfig {
	enabled: boolean;
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	recipients: string[];
}

export class EmailNotifier {
	private transporter: nodemailer.Transporter | null = null;
	private config: EmailConfig;

	constructor() {
		this.config = this.loadConfig();
		this.initialize();
	}

	private loadConfig(): EmailConfig {
		return {
			enabled: process.env.EMAIL_ENABLED === 'true',
			host: process.env.EMAIL_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.EMAIL_PORT || '587'),
			secure: process.env.EMAIL_SECURE === 'true',
			user: process.env.EMAIL_USER || '',
			pass: process.env.EMAIL_PASS || '',
			recipients: []
		};
	}

	private initialize(): void {
		if (this.config.enabled && this.config.user && this.config.pass) {
			this.transporter = nodemailer.createTransport({
				host: this.config.host,
				port: this.config.port,
				secure: this.config.secure,
				auth: {
					user: this.config.user,
					pass: this.config.pass,
				},
			});
		}
	}

	/**
	 * Send email notification
	 */
	async sendEmail(subject: string, html: string, recipients: string[]): Promise<boolean> {
		if (!this.transporter || !this.config.enabled || recipients.length === 0) {
			return false;
		}

		try {
			const mailOptions = {
				from: this.config.user,
				to: recipients.join(', '),
				subject,
				html
			};

			const result = await this.transporter.sendMail(mailOptions);
			console.log('Email sent successfully:', result.messageId);
			return true;
		} catch (error) {
			console.error('Error sending email:', error);
			throw error;
		}
	}

	/**
	 * Test email functionality
	 */
	async testEmail(): Promise<boolean> {
		if (!this.transporter) {
			return false;
		}

		try {
			await this.transporter.verify();
			return true;
		} catch (error) {
			console.error('Email test failed:', error);
			return false;
		}
	}

	/**
	 * Get email service status
	 */
	getStatus(): { enabled: boolean; configured: boolean; ready: boolean } {
		return {
			enabled: this.config.enabled,
			configured: !!(this.config.user && this.config.pass),
			ready: !!this.transporter
		};
	}

	/**
	 * Update recipients
	 */
	setRecipients(recipients: string[]): void {
		this.config.recipients = recipients;
	}

	/**
	 * Get current recipients
	 */
	getRecipients(): string[] {
		return this.config.recipients;
	}
}
