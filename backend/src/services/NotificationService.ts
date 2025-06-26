import nodemailer from 'nodemailer';
import { Alert, Settings } from '../models';

export interface AlertData {
	type: 'temperature' | 'humidity' | 'soilMoisture' | 'waterLevel' | 'device';
	level: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	currentValue?: number;
	threshold?: { min?: number; max?: number };
	deviceType?: string;
}

export interface EmailConfig {
	enabled: boolean;
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	recipients: string[];
}

class NotificationService {
	private emailTransporter: nodemailer.Transporter | null = null;
	private emailConfig: EmailConfig;
	private lastAlertTime: Map<string, number> = new Map();
	private alertCooldown = 5 * 60 * 1000; // 5 minutes cooldown

	constructor() {
		this.emailConfig = this.loadEmailConfig();
		this.initializeEmailService();
	}

	private loadEmailConfig(): EmailConfig {
		return {
			enabled: process.env.EMAIL_ENABLED === 'true',
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.SMTP_PORT || '587'),
			secure: process.env.SMTP_SECURE === 'true',
			user: process.env.SMTP_USER || '',
			pass: process.env.SMTP_PASS || '',
			recipients: []
		};
	}

	private initializeEmailService(): void {
		if (this.emailConfig.enabled && this.emailConfig.user && this.emailConfig.pass) {
			this.emailTransporter = nodemailer.createTransport({
				host: this.emailConfig.host,
				port: this.emailConfig.port,
				secure: this.emailConfig.secure,
				auth: {
					user: this.emailConfig.user,
					pass: this.emailConfig.pass,
				},
			});
		}
	}

	// Main trigger alert function - centralized for easy extension
	async triggerAlert(alertData: AlertData): Promise<void> {
		try {
			const alertKey = `${alertData.type}_${alertData.level}`;
			const now = Date.now();

			// Check cooldown to prevent spam
			const lastAlert = this.lastAlertTime.get(alertKey);
			if (lastAlert && (now - lastAlert) < this.alertCooldown) {
				return;
			}

			console.log(`🚨 Alert triggered: ${alertData.type} - ${alertData.message}`);

			// Save alert to database
			await this.saveAlertToDatabase(alertData);

			// Get recipients from settings
			const recipients = await this.getEmailRecipients();
			if (recipients.length > 0) {
				this.emailConfig.recipients = recipients;
			}

			// Send email notification
			if (this.emailConfig.enabled && this.emailConfig.recipients.length > 0) {
				await this.sendEmailAlert(alertData);
			}

			// Update last alert time
			this.lastAlertTime.set(alertKey, now);

			// Future extensions can be added here:
			// - SMS notifications
			// - Push notifications  
			// - Webhook calls
			// - Automation triggers

		} catch (error) {
			console.error('Error triggering alert:', error);
		}
	}

	private async saveAlertToDatabase(alertData: AlertData): Promise<void> {
		try {
			const alert = new Alert({
				type: alertData.type,
				level: alertData.level,
				message: alertData.message,
				value: alertData.currentValue,
				threshold: alertData.threshold,
				deviceType: alertData.deviceType,
				timestamp: new Date(),
				resolved: false
			});

			await alert.save();
		} catch (error) {
			console.error('Error saving alert to database:', error);
		}
	}

	private async getEmailRecipients(): Promise<string[]> {
		try {
			const settings = await Settings.findOne().lean();
			return settings?.notifications?.emailRecipients || [];
		} catch (error) {
			console.error('Error getting email recipients:', error);
			return [];
		}
	}

	private async sendEmailAlert(alertData: AlertData): Promise<void> {
		if (!this.emailTransporter) {
			console.log('Email transporter not configured');
			return;
		}

		try {
			const subject = `🚨 Smart Greenhouse Alert - ${alertData.type.toUpperCase()}`;
			const htmlContent = this.generateEmailHTML(alertData);

			for (const recipient of this.emailConfig.recipients) {
				await this.emailTransporter.sendMail({
					from: `"Smart Greenhouse System" <${this.emailConfig.user}>`,
					to: recipient,
					subject: subject,
					html: htmlContent,
				});
			}

			console.log(`Email alerts sent to ${this.emailConfig.recipients.length} recipients`);
		} catch (error) {
			console.error('Error sending email alert:', error);
		}
	}

	private generateEmailHTML(alertData: AlertData): string {
		const timestamp = new Date().toLocaleString();
		const severityColor = this.getSeverityColor(alertData.level);

		return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: ${severityColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
          .value-box { background-color: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Smart Greenhouse Alert</h2>
            <p>Level: ${alertData.level.toUpperCase()}</p>
          </div>
          <div class="content">
            <h3>Alert Details</h3>
            <p><strong>Type:</strong> ${alertData.type}</p>
            <p><strong>Message:</strong> ${alertData.message}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            
            ${alertData.currentValue !== undefined ? `
            <div class="value-box">
              <strong>Current Value:</strong> ${alertData.currentValue}
            </div>
            ` : ''}
            
            ${alertData.threshold ? `
            <div class="value-box">
              <strong>Threshold:</strong> 
              ${alertData.threshold.min !== undefined ? `Min: ${alertData.threshold.min}` : ''}
              ${alertData.threshold.max !== undefined ? `Max: ${alertData.threshold.max}` : ''}
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from your Smart Greenhouse System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
	}

	private getSeverityColor(level: string): string {
		switch (level) {
			case 'critical': return '#dc3545';
			case 'high': return '#fd7e14';
			case 'medium': return '#ffc107';
			case 'low': return '#17a2b8';
			default: return '#6c757d';
		}
	}

	// Method to update email configuration from frontend
	async updateEmailConfig(recipients: string[]): Promise<void> {
		try {
			await Settings.findOneAndUpdate(
				{},
				{
					$set: {
						'notifications.emailRecipients': recipients,
						'notifications.email': true
					}
				},
				{ upsert: true }
			);
			console.log('Email recipients updated:', recipients);
		} catch (error) {
			console.error('Error updating email recipients:', error);
		}
	}

	// Method to test email configuration
	async testEmailConfiguration(recipient: string): Promise<boolean> {
		try {
			if (!this.emailTransporter) {
				return false;
			}

			await this.emailTransporter.sendMail({
				from: `"Smart Greenhouse System" <${this.emailConfig.user}>`,
				to: recipient,
				subject: '✅ Test Email - Smart Greenhouse System',
				html: `
          <h3>Email Configuration Test</h3>
          <p>This is a test email from your Smart Greenhouse System.</p>
          <p>If you received this email, the configuration is working correctly.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        `,
			});

			return true;
		} catch (error) {
			console.error('Email test failed:', error);
			return false;
		}
	}
}

export const notificationService = new NotificationService();
export { NotificationService };
