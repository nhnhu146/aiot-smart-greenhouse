import nodemailer from 'nodemailer';
import { Config } from '../../config/AppConfig';
export interface EmailOptions {
	to: string | string[]
	subject: string
	htmlContent: string
	textContent?: string
	from?: string
}

export class EmailSender {
	constructor(private transporter: nodemailer.Transporter) {}

	async sendEmail(options: EmailOptions): Promise<boolean> {
		try {
			const fromAddress = options.from || Config.email.user;
			if (!fromAddress) {
				throw new Error('No sender email address configured');
			}

			const mailOptions: nodemailer.SendMailOptions = {
				from: `'Smart Greenhouse System' <${fromAddress}>`,
				to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
				subject: options.subject,
				html: options.htmlContent,
				text: options.textContent || this.extractTextFromHtml(options.htmlContent)
			};
			const info = await this.transporter.sendMail(mailOptions);
			console.log('📧 Email sent successfully:', {
				messageId: info.messageId,
				to: options.to,
				subject: options.subject
			});
			return true;
		} catch (error) {
			console.error('❌ Failed to send email:', error);
			return false;
		}
	}

	async sendBulkEmails(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
		let sent = 0;
		let failed = 0;
		for (const email of emails) {
			const success = await this.sendEmail(email);
			if (success) {
				sent++;
			} else {
				failed++;
			}

			// Small delay to respect rate limits
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		console.log(`📊 Bulk email results: ${sent} sent, ${failed} failed`);
		return { sent, failed };
	}

	private extractTextFromHtml(html: string): string {
		// Simple HTML to text conversion
		return html
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace &nbsp
			.replace(/&amp;/g, '&') // Replace &amp
			.replace(/&lt;/g, '<') // Replace &lt
			.replace(/&gt;/g, '>') // Replace &gt
			.replace(/\s+/g, ' ') // Replace multiple spaces
			.trim();
	}
}
