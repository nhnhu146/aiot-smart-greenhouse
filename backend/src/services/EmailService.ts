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
			// Try multiple paths for template loading (development vs production)
			const possiblePaths = [
				path.join(__dirname, '..', 'templates', templateName),
				path.join(__dirname, 'templates', templateName),
				path.join(process.cwd(), 'src', 'templates', templateName),
				path.join(process.cwd(), 'dist', 'templates', templateName)
			];

			console.log(`📧 [DEBUG] Looking for template: ${templateName}`);

			for (const templatePath of possiblePaths) {
				console.log(`📧 [DEBUG] Trying path: ${templatePath}`);
				if (fs.existsSync(templatePath)) {
					const content = fs.readFileSync(templatePath, 'utf-8');
					console.log(`📧 [DEBUG] Template loaded from: ${templatePath}, size: ${content.length} characters`);
					return content;
				}
			}

			console.log(`❌ [ERROR] Template file not found in any of the expected paths`);
			return '';
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
				['timestamp', new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })],
				['currentYear', new Date().getFullYear().toString()],
				['testMessage', 'Hệ thống email Smart Greenhouse hoạt động bình thường! Email test đã được gửi thành công.']
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
			templatesLoaded: 4, // enhanced-test-email, enhanced-alert-email, batch-alert-email, password-reset-email
			poolingEnabled: this.isConfigured,
			service: 'gmail'
		};
	}

	// Send batch alert email with multiple alerts
	async sendBatchAlertEmail(recipient: string, alertSummary: any): Promise<void> {
		if (!this.isConfigured) {
			console.log('⚠️  Email not configured. Demo mode - would send batch alert email to:', recipient);
			return;
		}

		try {
			console.log(`📧 Sending batch alert email to ${recipient}...`);

			// Load batch alert template
			const template = await this.loadTemplate('batch-alert-email.html');

			// Build proper alert counts by level
			const criticalCount = alertSummary.alerts.filter((a: any) => a.level === 'critical').length;
			const highCount = alertSummary.alerts.filter((a: any) => a.level === 'high').length;
			const mediumCount = alertSummary.alerts.filter((a: any) => a.level === 'medium').length;
			const lowCount = alertSummary.alerts.filter((a: any) => a.level === 'low').length;

			// Replace template variables correctly matching the template
			let htmlContent = template
				.replace(/{{alertCount}}/g, alertSummary.totalAlerts.toString())
				.replace(/{{frequencyMinutes}}/g, '15') // Default frequency
				.replace(/{{timeRange}}/g, new Date(alertSummary.timestamp).toLocaleString())
				.replace(/{{criticalCount}}/g, criticalCount.toString())
				.replace(/{{highCount}}/g, highCount.toString())
				.replace(/{{mediumCount}}/g, mediumCount.toString())
				.replace(/{{lowCount}}/g, lowCount.toString())
				.replace(/{{generatedAt}}/g, new Date().toLocaleString())
				.replace(/{{nextSummaryTime}}/g, '15')
				.replace(/{{dashboardUrl}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');

			// Process alerts for Handlebars-style {{#each alerts}} block
			const alertsSection = this.buildAlertsSection(alertSummary.alerts);
			htmlContent = htmlContent.replace(/{{#each alerts}}[\s\S]*?{{\/each}}/g, alertsSection);

			// Inline CSS
			const inlinedHtml = await inline(htmlContent);

			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: recipient,
				subject: `🚨 Smart Greenhouse - ${alertSummary.totalAlerts} Alert(s) Summary`,
				html: inlinedHtml
			};

			const info = await this.transporter!.sendMail(mailOptions);
			console.log(`✅ Batch alert email sent successfully to ${recipient}:`, info.messageId);
		} catch (error) {
			console.error(`❌ Failed to send batch alert email to ${recipient}:`, error);
			throw error;
		}
	}

	// Build alerts section for template
	private buildAlertsSection(alerts: any[]): string {
		return alerts.map(alert => {
			const sensorType = this.formatSensorType(alert.type || alert.sensorType || 'unknown');
			const currentValue = this.formatCurrentValue(alert);
			const threshold = this.formatThreshold(alert.threshold);
			const message = alert.message || `${sensorType} value detected`;
			const timestamp = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : new Date().toLocaleString();

			return `
			<div class="alert-item ${alert.level || 'medium'}">
				<div class="alert-header">
					<div class="alert-type">${sensorType}</div>
					<div class="alert-level ${alert.level || 'medium'}">${(alert.level || 'medium').toUpperCase()}</div>
				</div>
				<div class="alert-details">
					<strong>Current Value:</strong> ${currentValue}<br>
					<strong>Threshold:</strong> ${threshold}<br>
					<strong>Message:</strong> ${message}
				</div>
				<div class="alert-time">${timestamp}</div>
			</div>`;
		}).join('');
	}

	// Format sensor type for display
	private formatSensorType(type: string): string {
		if (!type || type === 'null' || type === 'undefined') {
			return '⚠️ Unknown Sensor';
		}

		switch (type.toLowerCase()) {
			case 'temperature': return '🌡️ Temperature';
			case 'humidity': return '💧 Humidity';
			case 'soilmoisture':
			case 'soil': return '🌱 Soil Moisture';
			case 'waterlevel':
			case 'water': return '🚰 Water Level';
			case 'lightlevel':
			case 'light': return '☀️ Light Level';
			case 'rainstatus':
			case 'rain': return '🌧️ Rain Status';
			case 'plantheight':
			case 'height': return '📏 Plant Height';
			default: return `⚠️ ${type}`;
		}
	}

	// Format current value for display
	private formatCurrentValue(alert: any): string {
		if (alert.currentValue === null || alert.currentValue === undefined || alert.currentValue === 'null') {
			return 'N/A';
		}

		const type = (alert.type || alert.sensorType || '').toLowerCase();
		const value = alert.currentValue;

		if (type === 'soilmoisture' || type === 'soil') {
			return value === 0 ? 'Dry (0)' : value === 1 ? 'Wet (1)' : `${value}`;
		}

		if (type === 'waterlevel' || type === 'water') {
			return value === 0 ? 'Normal (0)' : value === 1 ? 'Flooded (1)' : `${value}`;
		}

		if (type === 'lightlevel' || type === 'light') {
			return value === 0 ? 'Dark (0)' : value === 1 ? 'Bright (1)' : `${value}`;
		}

		if (type === 'rainstatus' || type === 'rain') {
			return value === 0 ? 'No Rain (0)' : value === 1 ? 'Raining (1)' : `${value}`;
		}

		return `${value}${this.getUnit(type)}`;
	}

	// Format threshold for display
	private formatThreshold(threshold: any): string {
		if (!threshold || threshold === null || threshold === undefined || threshold === 'null') {
			return 'Auto-alert (binary sensor)';
		}
		if (typeof threshold === 'object') {
			if (threshold.min !== undefined && threshold.max !== undefined) {
				return `${threshold.min} - ${threshold.max}`;
			}
			if (threshold.min !== undefined) {
				return `Min: ${threshold.min}`;
			}
			if (threshold.max !== undefined) {
				return `Max: ${threshold.max}`;
			}
		}
		return 'Auto-alert (no threshold)';
	}

	// Get unit for sensor type
	private getUnit(type: string): string {
		if (!type) return '';

		switch (type.toLowerCase()) {
			case 'temperature': return '°C';
			case 'humidity': return '%';
			case 'waterlevel':
			case 'water': return '';
			case 'plantheight':
			case 'height': return 'cm';
			case 'soilmoisture':
			case 'soil': return '';
			case 'lightlevel':
			case 'light': return '';
			case 'rainstatus':
			case 'rain': return '';
			default: return '';
		}
	}

	// Get icon for alert type
	private getAlertIcon(type: string): string {
		switch (type) {
			case 'temperature': return '🌡️';
			case 'humidity': return '💧';
			case 'soilMoisture': return '🌱';
			case 'waterLevel': return '💧';
			default: return '⚠️';
		}
	}

	public reloadTemplates(): void {
		// Templates are loaded on-demand now, so this is just for compatibility
		console.log('✅ Templates are loaded on-demand');
	}
}

export const emailService = new EmailService();
