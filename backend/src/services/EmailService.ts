import nodemailer from 'nodemailer';
import { Settings } from '../types';

export class EmailService {
	private transporter: nodemailer.Transporter | null = null;
	private isEnabled: boolean = false;

	constructor() {
		this.setupTransporter();
	}

	private setupTransporter(): void {
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			console.warn('⚠️ Email credentials not configured. Email alerts disabled.');
			return;
		}

		this.transporter = nodemailer.createTransport({
			service: process.env.EMAIL_SERVICE || 'gmail',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS
			},
			tls: {
				rejectUnauthorized: false
			}
		});

		// Verify connection
		this.transporter.verify((error, success) => {
			if (error) {
				console.error('❌ Email transporter verification failed:', error);
				this.isEnabled = false;
			} else {
				console.log('✅ Email service initialized successfully');
				this.isEnabled = true;
			}
		});
	}

	/**
	 * Send temperature threshold alert
	 */
	async sendTemperatureAlert(temperature: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		if (!this.isEnabled) return;

		const subject = '🌡️ Temperature Alert - Smart Greenhouse';
		const isHigh = temperature > threshold.max;
		const isLow = temperature < threshold.min;

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: ${isHigh ? '#e74c3c' : '#3498db'};">
					${isHigh ? '🔥' : '❄️'} Temperature ${isHigh ? 'High' : 'Low'} Alert
				</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
					<p><strong>Current Temperature:</strong> ${temperature}°C</p>
					<p><strong>Threshold Range:</strong> ${threshold.min}°C - ${threshold.max}°C</p>
					<p><strong>Status:</strong> <span style="color: ${isHigh ? '#e74c3c' : '#3498db'}; font-weight: bold;">
						${isHigh ? 'ABOVE MAXIMUM' : 'BELOW MINIMUM'}
					</span></p>
				</div>
				<p><strong>Recommended Actions:</strong></p>
				<ul>
					${isHigh ?
				'<li>Turn on ventilation system</li><li>Check cooling equipment</li><li>Provide shade if necessary</li>' :
				'<li>Check heating system</li><li>Close windows/vents</li><li>Monitor plant health</li>'
			}
				</ul>
				<p style="color: #7f8c8d; font-size: 12px;">
					Time: ${new Date().toLocaleString()}<br>
					Smart Greenhouse Monitoring System
				</p>
			</div>
		`;

		await this.sendEmail(recipients, subject, html);
	}

	/**
	 * Send humidity threshold alert
	 */
	async sendHumidityAlert(humidity: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		if (!this.isEnabled) return;

		const subject = '💧 Humidity Alert - Smart Greenhouse';
		const isHigh = humidity > threshold.max;
		const isLow = humidity < threshold.min;

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: ${isHigh ? '#3498db' : '#e67e22'};">
					${isHigh ? '💧' : '🏜️'} Humidity ${isHigh ? 'High' : 'Low'} Alert
				</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
					<p><strong>Current Humidity:</strong> ${humidity}%</p>
					<p><strong>Threshold Range:</strong> ${threshold.min}% - ${threshold.max}%</p>
					<p><strong>Status:</strong> <span style="color: ${isHigh ? '#3498db' : '#e67e22'}; font-weight: bold;">
						${isHigh ? 'ABOVE MAXIMUM' : 'BELOW MINIMUM'}
					</span></p>
				</div>
				<p><strong>Recommended Actions:</strong></p>
				<ul>
					${isHigh ?
				'<li>Increase ventilation</li><li>Check for water leaks</li><li>Monitor for mold/fungus</li>' :
				'<li>Increase watering frequency</li><li>Check irrigation system</li><li>Add humidity sources</li>'
			}
				</ul>
				<p style="color: #7f8c8d; font-size: 12px;">
					Time: ${new Date().toLocaleString()}<br>
					Smart Greenhouse Monitoring System
				</p>
			</div>
		`;

		await this.sendEmail(recipients, subject, html);
	}

	/**
	 * Send soil moisture alert
	 */
	async sendSoilMoistureAlert(soilMoisture: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		if (!this.isEnabled) return;

		const subject = '🌱 Soil Moisture Alert - Smart Greenhouse';
		const isLow = soilMoisture < threshold.min;

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #e67e22;">
					🌱 Soil Moisture ${isLow ? 'Low' : 'High'} Alert
				</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
					<p><strong>Current Soil Moisture:</strong> ${soilMoisture}%</p>
					<p><strong>Threshold Range:</strong> ${threshold.min}% - ${threshold.max}%</p>
					<p><strong>Status:</strong> <span style="color: #e67e22; font-weight: bold;">
						${isLow ? 'TOO DRY' : 'TOO WET'}
					</span></p>
				</div>
				<p><strong>Recommended Actions:</strong></p>
				<ul>
					${isLow ?
				'<li>Activate irrigation system</li><li>Check water supply</li><li>Monitor plant stress signs</li>' :
				'<li>Reduce watering frequency</li><li>Improve drainage</li><li>Check for overwatering</li>'
			}
				</ul>
				<p style="color: #7f8c8d; font-size: 12px;">
					Time: ${new Date().toLocaleString()}<br>
					Smart Greenhouse Monitoring System
				</p>
			</div>
		`;

		await this.sendEmail(recipients, subject, html);
	}

	/**
	 * Send water level alert
	 */
	async sendWaterLevelAlert(waterLevel: number, threshold: { min: number; max: number }, recipients: string[]): Promise<void> {
		if (!this.isEnabled) return;

		const subject = '🚰 Water Level Alert - Smart Greenhouse';
		const isLow = waterLevel < threshold.min;

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #e74c3c;">
					🚰 Water Level ${isLow ? 'Low' : 'High'} Alert
				</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
					<p><strong>Current Water Level:</strong> ${waterLevel}%</p>
					<p><strong>Threshold Range:</strong> ${threshold.min}% - ${threshold.max}%</p>
					<p><strong>Status:</strong> <span style="color: #e74c3c; font-weight: bold;">
						${isLow ? 'CRITICALLY LOW' : 'OVERFLOW RISK'}
					</span></p>
				</div>
				<p><strong>Immediate Actions Required:</strong></p>
				<ul>
					${isLow ?
				'<li>Refill water reservoir immediately</li><li>Check for leaks</li><li>Disable irrigation until refilled</li>' :
				'<li>Check overflow drainage</li><li>Reduce water input</li><li>Inspect water level sensor</li>'
			}
				</ul>
				<p style="color: #7f8c8d; font-size: 12px;">
					Time: ${new Date().toLocaleString()}<br>
					Smart Greenhouse Monitoring System
				</p>
			</div>
		`;

		await this.sendEmail(recipients, subject, html);
	}

	/**
	 * Send system error alert
	 */
	async sendSystemErrorAlert(error: string, component: string, recipients: string[]): Promise<void> {
		if (!this.isEnabled) return;

		const subject = '⚠️ System Error Alert - Smart Greenhouse';

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #e74c3c;">
					⚠️ System Error Alert
				</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
					<p><strong>Component:</strong> ${component}</p>
					<p><strong>Error:</strong> ${error}</p>
					<p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
				</div>
				<p><strong>Recommended Actions:</strong></p>
				<ul>
					<li>Check system logs for detailed error information</li>
					<li>Verify network connectivity</li>
					<li>Restart affected components if necessary</li>
					<li>Contact system administrator if problem persists</li>
				</ul>
				<p style="color: #7f8c8d; font-size: 12px;">
					Smart Greenhouse Monitoring System
				</p>
			</div>
		`;

		await this.sendEmail(recipients, subject, html);
	}

	/**
	 * Send motion detection alert
	 */
	async sendMotionDetectedAlert(recipients: string[]): Promise<void> {
		if (!this.isEnabled) return;

		const subject = '👁️ Motion Detected - Smart Greenhouse';

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #9b59b6;">
					👁️ Motion Detected in Greenhouse
				</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
					<p><strong>Alert:</strong> Motion sensor has detected movement in the greenhouse</p>
					<p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
					<p><strong>Action Taken:</strong> Door automatically opened</p>
				</div>
				<p><strong>Please verify:</strong></p>
				<ul>
					<li>Check if authorized personnel are present</li>
					<li>Review security cameras if available</li>
					<li>Ensure greenhouse security</li>
				</ul>
				<p style="color: #7f8c8d; font-size: 12px;">
					Smart Greenhouse Security System
				</p>
			</div>
		`;

		await this.sendEmail(recipients, subject, html);
	}

	/**
	 * Generic email sending method
	 */
	private async sendEmail(recipients: string[], subject: string, html: string): Promise<void> {
		if (!this.isEnabled || recipients.length === 0 || !this.transporter) return;

		try {
			const mailOptions = {
				from: `"Smart Greenhouse System" <${process.env.EMAIL_USER}>`,
				to: recipients.join(', '),
				subject,
				html
			};

			const result = await this.transporter.sendMail(mailOptions);
			console.log(`📧 Email sent successfully to ${recipients.length} recipients: ${result.messageId}`);
		} catch (error) {
			console.error('❌ Failed to send email:', error);
		}
	}

	/**
	 * Test email functionality
	 */
	async sendTestEmail(recipients: string[]): Promise<boolean> {
		if (!this.isEnabled) {
			console.log('Email service is not enabled');
			return false;
		}

		try {
			const subject = '✅ Test Email - Smart Greenhouse System';
			const html = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #27ae60;">✅ Email Service Test</h2>
					<p>This is a test email from your Smart Greenhouse monitoring system.</p>
					<p>If you receive this email, the email alert system is working correctly.</p>
					<p style="color: #7f8c8d; font-size: 12px;">
						Time: ${new Date().toLocaleString()}<br>
						Smart Greenhouse Monitoring System
					</p>
				</div>
			`;

			await this.sendEmail(recipients, subject, html);
			return true;
		} catch (error) {
			console.error('Test email failed:', error);
			return false;
		}
	}

	/**
	 * Get service status
	 */
	getStatus(): { enabled: boolean; configured: boolean } {
		return {
			enabled: this.isEnabled,
			configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
		};
	}
}

export const emailService = new EmailService();
