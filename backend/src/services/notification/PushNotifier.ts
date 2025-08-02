import { sendPushNotification } from '../PushNotificationService';

/**
 * Push Notifier - Handles push notification sending
 * Focused on push notification functionality
 */

export interface PushNotificationData {
	title: string;
	message: string;
	priority?: 'low' | 'normal' | 'high';
}

export class PushNotifier {
	private enabled: boolean;

	constructor() {
		this.enabled = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';
	}

	/**
	 * Send push notification
	 */
	async sendPush(data: PushNotificationData): Promise<boolean> {
		if (!this.enabled) {
			console.log('Push notifications disabled');
			return false;
		}

		try {
			await sendPushNotification(data.title, data.message);
			console.log(`Push notification sent: ${data.title}`);
			return true;
		} catch (error) {
			console.error('Error sending push notification:', error);
			throw error;
		}
	}

	/**
	 * Test push notification
	 */
	async testPush(): Promise<boolean> {
		try {
			await this.sendPush({
				title: '🧪 Test Notification',
				message: 'Push notification service is working correctly!'
			});
			return true;
		} catch (error) {
			console.error('Push notification test failed:', error);
			return false;
		}
	}

	/**
	 * Get push notification status
	 */
	getStatus(): { enabled: boolean } {
		return {
			enabled: this.enabled
		};
	}

	/**
	 * Enable or disable push notifications
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}
}
