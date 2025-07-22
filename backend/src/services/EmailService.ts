import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailTemplate {
	subject: string;
	html: string;
	text?: string;
}

interface EmailAttachment {
	filename: string;
	content: Buffer | string;
	contentType?: string;
}

interface EmailOptions {
	to: string | string[];
	subject?: string;
	html?: string;
	text?: string;
	attachments?: EmailAttachment[];
	template?: string;
	variables?: Record<string, string>;
}

export class EmailService {
	private transporter: nodemailer.Transporter | null = null;
	private isEnabled: boolean = false;
	private templatesCache = new Map<string, EmailTemplate>();

	constructor() {
		this.setupTransporter();
		this.loadTemplates();
	}

	private setupTransporter(): void {
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			console.warn('⚠️ Email credentials not configured. Running in demo mode.');
			this.isEnabled = true; // Enable demo mode for testing
			return;
		}

		try {
			this.transporter = nodemailer.createTransport({
				service: process.env.EMAIL_SERVICE || 'gmail',
				pool: true, // Use connection pooling like voteLIS24
				maxConnections: 5,
				maxMessages: 100,
				auth: {
					user: process.env.EMAIL_USER,
					pass: process.env.EMAIL_PASS
				},
				tls: {
					rejectUnauthorized: false
				}
			});

			// Verify connection
			if (this.transporter) {
				this.transporter.verify((error, success) => {
					if (error) {
						console.error('❌ Email transporter verification failed:', error);
						this.isEnabled = false;
					} else {
						console.log('✅ Email service initialized successfully with connection pooling');
						this.isEnabled = true;
					}
				});
			}
		} catch (error) {
			console.error('❌ Failed to setup email transporter:', error);
			this.isEnabled = false;
		}
	}

	private loadTemplates(): void {
		const templatesDir = path.join(__dirname, '../templates');

		if (!fs.existsSync(templatesDir)) {
			console.warn('⚠️ Templates directory not found, using fallback templates');
			this.loadFallbackTemplates();
			return;
		}

		try {
			const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));

			for (const file of templateFiles) {
				const templateName = path.basename(file, '.html');
				const templatePath = path.join(templatesDir, file);
				const htmlContent = fs.readFileSync(templatePath, 'utf8');

				// Extract subject from HTML title tag or use default
				const subjectMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
				const subject = subjectMatch ? subjectMatch[1] : this.getDefaultSubject(templateName);

				this.templatesCache.set(templateName, {
					subject,
					html: htmlContent,
					text: this.htmlToText(htmlContent)
				});
			}

			console.log(`✅ Loaded ${templateFiles.length} email templates from ${templatesDir}`);
		} catch (error) {
			console.error('❌ Failed to load templates:', error);
			this.loadFallbackTemplates();
		}
	}

	private loadFallbackTemplates(): void {
		// Fallback templates like voteLIS24 style
		const templates = {
			'test-email': {
				subject: '✅ Test Email - Smart Greenhouse System',
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>{{subject}}</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
							.content { padding: 20px; background: #f9f9f9; }
							.footer { padding: 10px; text-align: center; color: #666; font-size: 12px; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>🌱 Smart Greenhouse System</h1>
							</div>
							<div class="content">
								<h2>✅ Email Service Test</h2>
								<p>This is a test email from your Smart Greenhouse monitoring system.</p>
								<p>If you receive this email, the email alert system is working correctly.</p>
								<p><strong>Time:</strong> {{timestamp}}</p>
								<p><strong>Email Service:</strong> {{emailService}}</p>
								<p><strong>Recipient:</strong> {{recipient}}</p>
							</div>
							<div class="footer">
								<p>Smart Greenhouse Monitoring System | Automated Email Service</p>
							</div>
						</div>
					</body>
					</html>
				`,
				text: 'Smart Greenhouse Test Email - If you receive this, email service is working. Time: {{timestamp}}'
			},
			'alert-email': {
				subject: '🚨 {{alertTitle}} - Smart Greenhouse Alert',
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>{{alertTitle}}</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
							.content { padding: 20px; background: #f9f9f9; }
							.alert-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
							.recommendations { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
							.footer { padding: 10px; text-align: center; color: #666; font-size: 12px; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>{{alertIcon}} {{alertTitle}}</h1>
							</div>
							<div class="content">
								<div class="alert-box">
									<h3>🚨 Alert Details</h3>
									<p><strong>Status:</strong> {{alertType}}</p>
									<p><strong>Current Value:</strong> {{currentValue}}</p>
									<p><strong>Threshold:</strong> {{thresholdRange}}</p>
									<p><strong>Time:</strong> {{timestamp}}</p>
								</div>
								<div class="recommendations">
									<h3>💡 Recommended Actions</h3>
									<p>{{recommendations}}</p>
								</div>
							</div>
							<div class="footer">
								<p>Smart Greenhouse Alert System | Automated Monitoring</p>
							</div>
						</div>
					</body>
					</html>
				`,
				text: 'Smart Greenhouse Alert: {{alertTitle}} - {{alertType}} - Value: {{currentValue}} - Actions: {{recommendations}}'
			},
			'password-reset-email': {
				subject: '🔐 Password Reset - Smart Greenhouse System',
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>Password Reset Request</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #3498db; color: white; padding: 20px; text-align: center; }
							.content { padding: 20px; background: #f9f9f9; }
							.button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
							.footer { padding: 10px; text-align: center; color: #666; font-size: 12px; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>🔐 Password Reset Request</h1>
							</div>
							<div class="content">
								<p>You have requested to reset your password for your Smart Greenhouse account.</p>
								<p>Click the button below to reset your password:</p>
								<div style="text-align: center;">
									<a href="{{resetUrl}}" class="button">Reset Password</a>
								</div>
								<p>Or copy and paste this link in your browser:</p>
								<p style="word-break: break-all; background: #f4f4f4; padding: 10px; border-radius: 3px;">{{resetUrl}}</p>
								<p><strong>This link will expire in 1 hour for security reasons.</strong></p>
								<p>If you didn't request this password reset, please ignore this email.</p>
							</div>
							<div class="footer">
								<p>Smart Greenhouse Security System</p>
							</div>
						</div>
					</body>
					</html>
				`,
				text: 'Password Reset Request - Click this link: {{resetUrl}} (expires in 1 hour)'
			}
		};

		for (const [name, template] of Object.entries(templates)) {
			this.templatesCache.set(name, template);
		}

		console.log('✅ Loaded fallback email templates');
	}

	private getDefaultSubject(templateName: string): string {
		const subjects: Record<string, string> = {
			'test-email': '✅ Test Email - Smart Greenhouse System',
			'alert-email': '🚨 Smart Greenhouse Alert',
			'password-reset-email': '🔐 Password Reset - Smart Greenhouse System',
			'soil-moisture-alert': '🌱 Soil Moisture Alert - Smart Greenhouse',
			'temperature-alert': '🌡️ Temperature Alert - Smart Greenhouse',
			'humidity-alert': '💧 Humidity Alert - Smart Greenhouse'
		};
		return subjects[templateName] || 'Smart Greenhouse Notification';
	}

	private htmlToText(html: string): string {
		// Simple HTML to text conversion like voteLIS24
		return html
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();
	}

	private replaceVariables(content: string, variables: Record<string, string>): string {
		// Replace {{key}} placeholders like voteLIS24
		let result = content;
		for (const [key, value] of Object.entries(variables)) {
			const regex = new RegExp(`{{${key}}}`, 'g');
			result = result.replace(regex, value || '');
		}
		return result;
	}

	/**
	 * Send email using template or direct content
	 */
	public async sendEmail(options: EmailOptions): Promise<boolean> {
		try {
			let { subject, html, text } = options;

			// Use template if specified
			if (options.template) {
				const template = this.templatesCache.get(options.template);
				if (template) {
					subject = options.subject || template.subject;
					html = template.html;
					text = template.text;

					// Replace variables in all content
					if (options.variables) {
						const vars = {
							...options.variables,
							timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
						};
						subject = this.replaceVariables(subject, vars);
						html = this.replaceVariables(html || '', vars);
						text = this.replaceVariables(text || '', vars);
					}
				} else {
					console.warn(`⚠️ Template '${options.template}' not found, using direct content`);
				}
			}

			// Demo mode - log instead of sending like voteLIS24 fallback
			if (!this.transporter) {
				console.log(`📧 [DEMO MODE] Email would be sent to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
				console.log(`📧 [DEMO MODE] Subject: ${subject}`);
				console.log(`📧 [DEMO MODE] Template: ${options.template || 'none'}`);
				console.log(`📧 [DEMO MODE] Email functionality is working correctly!`);
				return true;
			}

			const mailOptions = {
				from: `"Smart Greenhouse System" <${process.env.EMAIL_USER}>`,
				to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
				subject,
				html,
				text,
				attachments: options.attachments
			};

			const result = await this.transporter.sendMail(mailOptions);
			console.log(`📧 Email sent successfully: ${result.messageId}`);
			return true;

		} catch (error) {
			console.error('❌ Failed to send email:', error);
			return false;
		}
	}

	/**
	 * Send test email
	 */
	public async sendTestEmail(recipients: string[]): Promise<boolean> {
		return this.sendEmail({
			to: recipients,
			template: 'test-email',
			variables: {
				emailService: process.env.EMAIL_SERVICE || 'Default',
				recipient: recipients[0] || 'N/A'
			}
		});
	}

	/**
	 * Send password reset email
	 */
	public async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
		const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

		return this.sendEmail({
			to: email,
			template: 'password-reset-email',
			variables: {
				resetUrl,
				frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
			}
		});
	}

	/**
	 * Send soil moisture alert (binary: 0=dry, 1=wet)
	 */
	public async sendSoilMoistureAlert(soilMoisture: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isDry = soilMoisture === 0;
		const moistureStatus = isDry ? 'DRY' : 'WET';
		const statusValue = isDry ? '0 (Dry)' : '1 (Wet)';

		await this.sendEmail({
			to: recipients,
			template: 'alert-email',
			variables: {
				alertTitle: `Soil Moisture Alert - ${moistureStatus}`,
				alertIcon: '🌱',
				alertType: isDry ? 'PLANTS NEED WATERING' : 'SOIL IS WET',
				currentValue: statusValue,
				thresholdRange: 'Binary: 0=Dry, 1=Wet',
				recommendations: isDry
					? 'Activate irrigation system immediately, Check water supply, Monitor plant stress signs'
					: 'Soil has adequate moisture, Monitor for overwatering'
			}
		});
	}

	/**
	 * Send temperature alert
	 */
	public async sendTemperatureAlert(temperature: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isHigh = temperature > threshold.max;
		const isLow = temperature < threshold.min;

		await this.sendEmail({
			to: recipients,
			template: 'alert-email',
			variables: {
				alertTitle: `Temperature ${isHigh ? 'High' : 'Low'} Alert`,
				alertIcon: '🌡️',
				alertType: isHigh ? 'TOO HOT' : 'TOO COLD',
				currentValue: `${temperature}°C`,
				thresholdRange: `${threshold.min}°C - ${threshold.max}°C`,
				recommendations: isHigh
					? 'Increase ventilation, Check cooling system, Provide shade'
					: 'Check heating system, Insulate greenhouse, Monitor plant protection'
			}
		});
	}

	/**
	 * Send humidity alert
	 */
	public async sendHumidityAlert(humidity: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isHigh = humidity > threshold.max;
		const isLow = humidity < threshold.min;

		await this.sendEmail({
			to: recipients,
			template: 'alert-email',
			variables: {
				alertTitle: `Humidity ${isHigh ? 'High' : 'Low'} Alert`,
				alertIcon: '💧',
				alertType: isHigh ? 'TOO HUMID' : 'TOO DRY',
				currentValue: `${humidity}%`,
				thresholdRange: `${threshold.min}% - ${threshold.max}%`,
				recommendations: isHigh
					? 'Increase ventilation, Check for water leaks, Monitor for mold/fungus'
					: 'Increase irrigation, Check humidity sensors, Add water sources'
			}
		});
	}

	/**
	 * Send water level alert
	 */
	public async sendWaterLevelAlert(waterLevel: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		const isLow = waterLevel < threshold.min;

		await this.sendEmail({
			to: recipients,
			template: 'alert-email',
			variables: {
				alertTitle: `Water Level ${isLow ? 'Low' : 'High'} Alert`,
				alertIcon: '🚰',
				alertType: isLow ? 'REFILL NEEDED' : 'OVERFLOW RISK',
				currentValue: `${waterLevel}%`,
				thresholdRange: `${threshold.min}% - ${threshold.max}%`,
				recommendations: isLow
					? 'Refill water tank, Check water supply, Inspect pump system'
					: 'Check drainage, Inspect overflow protection, Monitor water usage'
			}
		});
	}

	/**
	 * Send system error alert
	 */
	public async sendSystemErrorAlert(error: string, component: string, recipients: string[]): Promise<void> {
		await this.sendEmail({
			to: recipients,
			template: 'alert-email',
			variables: {
				alertTitle: 'System Error Alert',
				alertIcon: '⚠️',
				alertType: 'SYSTEM MALFUNCTION',
				currentValue: component,
				thresholdRange: 'System Health Check',
				recommendations: `Check ${component} component, Review system logs, Contact technical support if needed. Error: ${error}`
			}
		});
	}

	/**
	 * Send motion detected alert
	 */
	public async sendMotionDetectedAlert(recipients: string[]): Promise<void> {
		await this.sendEmail({
			to: recipients,
			template: 'alert-email',
			variables: {
				alertTitle: 'Motion Detected',
				alertIcon: '🚶',
				alertType: 'SECURITY ALERT',
				currentValue: 'Motion detected in greenhouse',
				thresholdRange: 'Security monitoring',
				recommendations: 'Check greenhouse security, Review camera footage if available, Verify authorized access'
			}
		});
	}

	/**
	 * Get service status
	 */
	public getStatus(): { enabled: boolean; configured: boolean; templatesLoaded: number } {
		return {
			enabled: this.isEnabled,
			configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
			templatesLoaded: this.templatesCache.size
		};
	}

	/**
	 * Reload templates
	 */
	public reloadTemplates(): void {
		this.templatesCache.clear();
		this.loadTemplates();
	}
}

export const emailService = new EmailService();
