import nodemailer from 'nodemailer';
import { inline } from '@css-inline/css-inline';
import fs from 'fs';
import path from 'path';

export class AdvancedEmailService {
	private transporter: nodemailer.Transporter | null = null;
	private isConfigured = false;

	constructor() {
		this.setupTransporter();
	}

	private setupTransporter(): void {
		const emailUser = process.env.EMAIL_USER;
		const emailPass = process.env.EMAIL_PASS;

		if (!emailUser || !emailPass) {
			console.log('⚠️  Email credentials not configured. Running in demo mode.');
			this.isConfigured = false;
			return;
		}

		try {
			// Connection pooling và advanced config như voteLIS24
			this.transporter = nodemailer.createTransport({
				service: 'gmail',
				pool: true, // Connection pooling
				maxConnections: 5,
				maxMessages: 100,
				rateLimit: 14, // Max 14 messages/sec
				auth: {
					user: emailUser,
					pass: emailPass
				}
			});

			this.isConfigured = true;
			console.log('📧 Advanced Email service configured with connection pooling');
		} catch (error) {
			console.error('❌ Failed to setup email transporter:', error);
			this.isConfigured = false;
		}
	}

	private async loadTemplate(templateName: string): Promise<string> {
		try {
			const templatePath = path.join(__dirname, '..', 'templates', templateName);
			return fs.readFileSync(templatePath, 'utf-8');
		} catch (error) {
			console.error(`❌ Failed to load template ${templateName}:`, error);
			return '';
		}
	}

	// Template replacement với Map như voteLIS24
	private replaceTemplateVariables(template: string, replacements: Map<string, string>): string {
		let result = template;
		for (const [key, value] of replacements) {
			const regex = new RegExp(`{{${key}}}`, 'g');
			result = result.replace(regex, value);
		}
		return result;
	}

	// CSS inline processing như voteLIS24
	private async processTemplate(template: string, replacements: Map<string, string>): Promise<{ html: string; text: string }> {
		try {
			// Replace variables first
			const processedTemplate = this.replaceTemplateVariables(template, replacements);

			// Inline CSS for better email compatibility
			const htmlWithInlineCSS = inline(processedTemplate);

			// Generate text version by stripping HTML
			const textVersion = htmlWithInlineCSS
				.replace(/<[^>]*>/g, '') // Remove HTML tags
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/\s+/g, ' ')
				.trim();

			return {
				html: htmlWithInlineCSS,
				text: textVersion
			};
		} catch (error) {
			console.error('❌ Failed to process template:', error);
			return {
				html: template,
				text: template.replace(/<[^>]*>/g, '')
			};
		}
	}

	public async sendAlertEmail(to: string, subject: string, sensorType: string, value: string, threshold: string): Promise<boolean> {
		if (!this.isConfigured) {
			console.log(`📧 [DEMO MODE] Email would be sent to: ${to}`);
			console.log(`📧 [DEMO MODE] Subject: ${subject}`);
			console.log(`📧 [DEMO MODE] Sensor: ${sensorType}, Value: ${value}, Threshold: ${threshold}`);
			return true;
		}

		try {
			const template = await this.loadTemplate('enhanced-alert-email.html');
			const replacements = new Map([
				['sensorType', sensorType],
				['value', value],
				['threshold', threshold],
				['timestamp', new Date().toLocaleString()],
				['currentYear', new Date().getFullYear().toString()]
			]); const { html, text } = await this.processTemplate(template, replacements);

			const mailOptions = {
				from: {
					name: 'Smart Greenhouse Alert',
					address: process.env.EMAIL_USER!
				},
				to,
				subject,
				html,
				text // Provide both HTML and text versions
			};

			await this.transporter!.sendMail(mailOptions);
			console.log(`📧 Alert email sent successfully to ${to}`);
			return true;
		} catch (error) {
			console.error('❌ Failed to send alert email:', error);
			return false;
		}
	}

	public async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
		if (!this.isConfigured) {
			console.log(`📧 [DEMO MODE] Password reset email would be sent to: ${to}`);
			console.log(`📧 [DEMO MODE] Reset token: ${resetToken}`);
			return true;
		}

		try {
			const template = await this.loadTemplate('password-reset-email.html');
			const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

			const replacements = new Map([
				['resetLink', resetLink],
				['timestamp', new Date().toLocaleString()],
				['currentYear', new Date().getFullYear().toString()]
			]);

			const { html, text } = await this.processTemplate(template, replacements);

			const mailOptions = {
				from: {
					name: 'Smart Greenhouse',
					address: process.env.EMAIL_USER!
				},
				to,
				subject: 'Password Reset Request - Smart Greenhouse',
				html,
				text
			};

			await this.transporter!.sendMail(mailOptions);
			console.log(`📧 Password reset email sent successfully to ${to}`);
			return true;
		} catch (error) {
			console.error('❌ Failed to send password reset email:', error);
			return false;
		}
	}

	public async sendTestEmail(to: string): Promise<boolean> {
		if (!this.isConfigured) {
			console.log(`📧 [DEMO MODE] Test email would be sent to: ${to}`);
			return true;
		}

		try {
			const template = await this.loadTemplate('enhanced-test-email.html');
			const replacements = new Map([
				['timestamp', new Date().toLocaleString()],
				['currentYear', new Date().getFullYear().toString()],
				['testMessage', 'Your Smart Greenhouse email system is working perfectly!']
			]); const { html, text } = await this.processTemplate(template, replacements);

			const mailOptions = {
				from: {
					name: 'Smart Greenhouse System',
					address: process.env.EMAIL_USER!
				},
				to,
				subject: 'Smart Greenhouse - Email System Test',
				html,
				text,
				priority: 'normal' as const
			};

			await this.transporter!.sendMail(mailOptions);
			console.log(`📧 Test email sent successfully to ${to}`);
			return true;
		} catch (error) {
			console.error('❌ Failed to send test email:', error);
			return false;
		}
	}

	// Utility method để đóng connection pool
	public async closeConnection(): Promise<void> {
		if (this.transporter && this.isConfigured) {
			this.transporter.close();
			console.log('📧 Email transporter connection pool closed');
		}
	}

	public getStatus() {
		return {
			configured: this.isConfigured,
			poolingEnabled: this.isConfigured,
			service: 'gmail'
		};
	}
}
