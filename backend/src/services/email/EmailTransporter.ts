import nodemailer from 'nodemailer';

export interface EmailConfig {
	user: string
	pass: string
	service?: string
	pooling?: boolean
	maxConnections?: number
	maxMessages?: number
	rateLimit?: number
}

export class EmailTransporter {
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
			// Connection pooling và advanced config
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

	public getTransporter(): nodemailer.Transporter | null {
		return this.transporter;
	}

	public isReady(): boolean {
		return this.isConfigured;
	}

	public async testConnection(): Promise<boolean> {
		if (!this.transporter || !this.isConfigured) {
			return false;
		}

		try {
			await this.transporter.verify();
			return true;
		} catch (error) {
			console.error('❌ Email connection test failed:', error);
			return false;
		}
	}
}
