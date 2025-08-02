export class AlertCooldownManager {
	private lastAlertTimes: Map<string, number> = new Map();
	private alertCooldownMs: number = 5 * 60 * 1000; // 5 minutes cooldown

	isInCooldown(sensorType: string): boolean {
		const lastAlertTime = this.lastAlertTimes.get(sensorType) || 0;
		const now = Date.now();
		return (now - lastAlertTime) < this.alertCooldownMs;
	}

	getCooldownRemaining(sensorType: string): number {
		const lastAlertTime = this.lastAlertTimes.get(sensorType) || 0;
		const now = Date.now();
		return Math.ceil((this.alertCooldownMs - (now - lastAlertTime)) / 1000 / 60);
	}

	setAlertTime(sensorType: string): void {
		this.lastAlertTimes.set(sensorType, Date.now());
	}

	clearAlertTime(sensorType: string): void {
		this.lastAlertTimes.delete(sensorType);
	}
}
