import nodemailer from 'nodemailer';
import { inline } from '@css-inline/css-inline';
import fs from 'fs';
import path from 'path';

export class EmailService {
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
			console.log('📧 Email service configured with connection pooling');
		} catch (error) {
			console.error('❌ Failed to setup email transporter:', error);
			this.isConfigured = false;
		}
	}

	private async loadTemplate(templateName: string): Promise<string> {
		try {
			const templatePath = path.join(__dirname, '..', 'templates', templateName);
			console.log(`📧 [DEBUG] Loading template from: ${templatePath}`);

			if (!fs.existsSync(templatePath)) {
				console.log(`❌ [ERROR] Template file does not exist: ${templatePath}`);
				return '';
			}

			const content = fs.readFileSync(templatePath, 'utf-8');
			console.log(`📧 [DEBUG] Template loaded successfully, size: ${content.length} characters`);
			return content;
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
			]);

			const { html, text } = await this.processTemplate(template, replacements);

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

	public async sendTestEmail(to: string | string[]): Promise<boolean> {
		// Handle both single email and array for backward compatibility
		const recipient = Array.isArray(to) ? to[0] : to;

		console.log(`📧 [DEBUG] sendTestEmail called with: ${recipient}`);
		console.log(`📧 [DEBUG] isConfigured: ${this.isConfigured}`);

		if (!this.isConfigured) {
			console.log(`📧 [DEMO MODE] Test email would be sent to: ${recipient}`);
			console.log(`📧 [DEMO MODE] Email credentials not configured - running in demo mode`);
			return true;
		}

		try {
			console.log(`📧 [DEBUG] Loading template: enhanced-test-email.html`);
			const template = await this.loadTemplate('enhanced-test-email.html');
			console.log(`📧 [DEBUG] Template loaded, length: ${template.length}`);

			if (template.length === 0) {
				console.log(`❌ [ERROR] Template is empty or failed to load`);
				return false;
			}

			const replacements = new Map([
				['timestamp', new Date().toLocaleString()],
				['currentYear', new Date().getFullYear().toString()],
				['testMessage', 'Your Smart Greenhouse email system is working perfectly!']
			]);

			console.log(`📧 [DEBUG] Processing template with replacements:`, Object.fromEntries(replacements));
			const { html, text } = await this.processTemplate(template, replacements);
			console.log(`📧 [DEBUG] Processed template - HTML length: ${html.length}, Text length: ${text.length}`);

			const mailOptions = {
				from: {
					name: 'Smart Greenhouse System',
					address: process.env.EMAIL_USER!
				},
				to: recipient,
				subject: 'Smart Greenhouse - Email System Test',
				html,
				text,
				priority: 'normal' as const
			};

			console.log(`📧 [DEBUG] Sending email to: ${recipient}`);
			await this.transporter!.sendMail(mailOptions);
			console.log(`📧 Test email sent successfully to ${recipient}`);
			return true;
		} catch (error) {
			console.error('❌ Failed to send test email:', error);
			return false;
		}
	}	// Additional methods for backward compatibility with existing alert system
	public async sendSoilMoistureAlert(soilMoisture: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isDry = soilMoisture === 0;
		const moistureStatus = isDry ? 'DRY' : 'WET';
		const statusValue = isDry ? '0 (Dry)' : '1 (Wet)';

		for (const recipient of recipients) {
			await this.sendAlertEmail(
				recipient,
				`🌱 Soil Moisture Alert - ${moistureStatus}`,
				'Soil Moisture',
				statusValue,
				'Binary: 0=Dry, 1=Wet'
			);
		}
	}

	public async sendTemperatureAlert(temperature: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isHigh = temperature > threshold.max;
		const isLow = temperature < threshold.min;
		const status = isHigh ? 'HIGH' : isLow ? 'LOW' : 'NORMAL';

		for (const recipient of recipients) {
			await this.sendAlertEmail(
				recipient,
				`🌡️ Temperature Alert - ${status}`,
				'Temperature',
				`${temperature}°C`,
				`${threshold.min}°C - ${threshold.max}°C`
			);
		}
	}

	public async sendHumidityAlert(humidity: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isHigh = humidity > threshold.max;
		const isLow = humidity < threshold.min;
		const status = isHigh ? 'HIGH' : isLow ? 'LOW' : 'NORMAL';

		for (const recipient of recipients) {
			await this.sendAlertEmail(
				recipient,
				`💧 Humidity Alert - ${status}`,
				'Humidity',
				`${humidity}%`,
				`${threshold.min}% - ${threshold.max}%`
			);
		}
	}

	public async sendWaterLevelAlert(waterLevel: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isLow = waterLevel < threshold.min;
		const status = isLow ? 'LOW' : 'HIGH';

		for (const recipient of recipients) {
			await this.sendAlertEmail(
				recipient,
				`🚰 Water Level ${status} Alert`,
				'Water Level',
				`${waterLevel}%`,
				`${threshold.min}% - ${threshold.max}%`
			);
		}
	}

	public async sendSystemErrorAlert(error: string, component: string, recipients: string[]): Promise<void> {
		for (const recipient of recipients) {
			await this.sendAlertEmail(
				recipient,
				`⚠️ System Error Alert`,
				'System Error',
				`${component}: ${error}`,
				'System Monitoring'
			);
		}
	}

	public async sendMotionDetectedAlert(recipients: string[]): Promise<void> {
		for (const recipient of recipients) {
			await this.sendAlertEmail(
				recipient,
				`🚶 Motion Detected Alert`,
				'Motion Detection',
				'Motion detected in greenhouse',
				'Security monitoring'
			);
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
			enabled: true, // Always enabled for backward compatibility
			configured: this.isConfigured,
			templatesLoaded: 3, // enhanced-test-email, enhanced-alert-email, password-reset-email
			poolingEnabled: this.isConfigured,
			service: 'gmail'
		};
	}

	public reloadTemplates(): void {
		// Templates are loaded on-demand now, so this is just for compatibility
		console.log('✅ Templates are loaded on-demand');
	}
}

export const emailService = new EmailService();
