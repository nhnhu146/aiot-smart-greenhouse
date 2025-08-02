/**
 * Notification Queue - Manages alert cooldowns and rate limiting
 * Focused on preventing spam and managing notification frequency
 */

export class NotificationQueue {
	private lastAlertTime: Map<string, number> = new Map();
	private alertCooldown: number;

	constructor(cooldownMinutes: number = 5) {
		this.alertCooldown = cooldownMinutes * 60 * 1000;
	}

	/**
	 * Check if alert should be sent based on cooldown
	 */
	shouldSendAlert(alertKey: string): boolean {
		const now = Date.now();
		const lastAlert = this.lastAlertTime.get(alertKey);

		if (lastAlert && (now - lastAlert) < this.alertCooldown) {
			const timeLeft = Math.round((this.alertCooldown - (now - lastAlert)) / 1000);
			console.log(`Alert cooldown active for ${alertKey}. Time left: ${timeLeft}s`);
			return false;
		}

		return true;
	}

	/**
	 * Mark alert as sent
	 */
	markAlertSent(alertKey: string): void {
		this.lastAlertTime.set(alertKey, Date.now());
	}

	/**
	 * Generate alert key for cooldown tracking
	 */
	generateAlertKey(type: string, level: string, currentValue?: number): string {
		const valueGroup = currentValue ? Math.floor(currentValue / 5) * 5 : 'na';
		return `${type}_${level}_${valueGroup}`;
	}

	/**
	 * Clear all cooldowns
	 */
	clearCooldowns(): void {
		this.lastAlertTime.clear();
	}

	/**
	 * Set cooldown duration
	 */
	setCooldown(minutes: number): void {
		this.alertCooldown = minutes * 60 * 1000;
	}

	/**
	 * Get current cooldown status
	 */
	getCooldownStatus(): { activeAlerts: number; cooldownMinutes: number } {
		return {
			activeAlerts: this.lastAlertTime.size,
			cooldownMinutes: this.alertCooldown / (60 * 1000)
		};
	}
}
