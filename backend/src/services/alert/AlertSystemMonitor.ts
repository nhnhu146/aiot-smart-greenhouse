import { alertService } from '../AlertService';
import { emailService } from '../EmailService';
import { SensorData } from '../../models';

export interface AlertSystemStatus {
	emailService: {
		configured: boolean;
		ready: boolean;
		lastTest?: Date;
		testResult?: boolean;
	};
	alertService: {
		active: boolean;
		thresholdsLoaded: boolean;
		lastAlertCheck?: Date;
	};
	recentAlerts: {
		count: number;
		lastAlert?: Date;
		types: string[];
	};
	sensorData: {
		lastUpdate?: Date;
		sensorsActive: string[];
	};
}

/**
 * Alert System Health Monitor
 * Monitors the health and status of the alert system components
 */
export class AlertSystemMonitor {
	private static lastEmailTest: Date | null = null;
	private static lastEmailTestResult: boolean = false;
	private static lastAlertCheck: Date | null = null;

	/**
	 * Get comprehensive status of the alert system
	 */
	static async getSystemStatus(): Promise<AlertSystemStatus> {
		const monitorId = `monitor-${Date.now()}`;
		console.log(`🔍 [${monitorId}] Getting alert system status...`);

		try {
			// Check email service status
			const emailStatus = emailService.getStatus();

			// Check alert service status
			const thresholds = alertService.getCurrentThresholds();

			// Get recent sensor data
			const recentSensorData = await SensorData.findOne()
				.sort({ createdAt: -1 })
				.lean();

			// Determine active sensors
			const activeSensors: string[] = [];
			if (recentSensorData) {
				if (recentSensorData.temperature !== undefined) activeSensors.push('temperature');
				if (recentSensorData.humidity !== undefined) activeSensors.push('humidity');
				if (recentSensorData.soilMoisture !== undefined) activeSensors.push('soilMoisture');
				if (recentSensorData.waterLevel !== undefined) activeSensors.push('waterLevel');
				if (recentSensorData.lightLevel !== undefined) activeSensors.push('lightLevel');
				if (recentSensorData.plantHeight !== undefined) activeSensors.push('plantHeight');
				if (recentSensorData.rainStatus !== undefined) activeSensors.push('rainStatus');
			}

			const status: AlertSystemStatus = {
				emailService: {
					configured: emailStatus.configured,
					ready: emailStatus.ready,
					lastTest: this.lastEmailTest || undefined,
					testResult: this.lastEmailTestResult
				},
				alertService: {
					active: !!alertService,
					thresholdsLoaded: !!thresholds,
					lastAlertCheck: this.lastAlertCheck || undefined
				},
				recentAlerts: {
					count: 0,
					types: []
				},
				sensorData: {
					lastUpdate: recentSensorData?.createdAt,
					sensorsActive: activeSensors
				}
			};

			console.log(`✅ [${monitorId}] Alert system status retrieved successfully`);
			return status;

		} catch (error) {
			console.error(`❌ [${monitorId}] Error getting system status:`, error);
			throw error;
		}
	}

	/**
	 * Test email notification system
	 */
	static async testEmailSystem(): Promise<boolean> {
		const testId = `email-test-${Date.now()}`;
		console.log(`📧 [${testId}] Testing email system...`);

		try {
			// Test email connection
			const connectionTest = await emailService.testConnection();
			if (!connectionTest) {
				console.warn(`⚠️ [${testId}] Email connection test failed`);
				this.lastEmailTest = new Date();
				this.lastEmailTestResult = false;
				return false;
			}

			// Send test email to system admin (if configured)
			const testResult = await emailService.sendTestEmail('system@localhost');

			this.lastEmailTest = new Date();
			this.lastEmailTestResult = testResult;

			if (testResult) {
				console.log(`✅ [${testId}] Email system test successful`);
			} else {
				console.warn(`⚠️ [${testId}] Email system test failed`);
			}

			return testResult;

		} catch (error) {
			console.error(`❌ [${testId}] Error testing email system:`, error);
			this.lastEmailTest = new Date();
			this.lastEmailTestResult = false;
			return false;
		}
	}

	/**
	 * Test alert threshold checking
	 */
	static async testAlertChecking(): Promise<boolean> {
		const testId = `alert-test-${Date.now()}`;
		console.log(`🔔 [${testId}] Testing alert checking system...`);

		try {
			// Get current thresholds
			const thresholds = alertService.getCurrentThresholds();
			if (!thresholds) {
				console.warn(`⚠️ [${testId}] No thresholds configured`);
				return false;
			}

			// Test with dummy data
			const testData = {
				temperature: 25, // Assume normal
				humidity: 60,    // Assume normal
				soilMoisture: 1, // Assume normal
				waterLevel: 50   // Assume normal
			};

			await alertService.checkSensorThresholds(testData);
			this.lastAlertCheck = new Date();

			console.log(`✅ [${testId}] Alert checking test completed`);
			return true;

		} catch (error) {
			console.error(`❌ [${testId}] Error testing alert checking:`, error);
			return false;
		}
	}

	/**
	 * Comprehensive health check of entire alert system
	 */
	static async performHealthCheck(): Promise<{
		overall: 'healthy' | 'degraded' | 'critical';
		details: AlertSystemStatus;
		issues: string[];
		recommendations: string[];
	}> {
		const healthCheckId = `health-${Date.now()}`;
		console.log(`🏥 [${healthCheckId}] Performing comprehensive alert system health check...`);

		const issues: string[] = [];
		const recommendations: string[] = [];

		try {
			// Get system status
			const status = await this.getSystemStatus();

			// Check email service
			if (!status.emailService.configured) {
				issues.push('Email service not configured');
				recommendations.push('Configure SMTP settings for email alerts');
			}

			// Check alert service
			if (!status.alertService.active) {
				issues.push('Alert service not active');
				recommendations.push('Restart alert service');
			}

			if (!status.alertService.thresholdsLoaded) {
				issues.push('Alert thresholds not loaded');
				recommendations.push('Configure alert thresholds');
			}

			// Check recent sensor data
			if (!status.sensorData.lastUpdate) {
				issues.push('No sensor data available');
				recommendations.push('Check MQTT connection and sensors');
			} else {
				const timeSinceLastUpdate = Date.now() - new Date(status.sensorData.lastUpdate).getTime();
				if (timeSinceLastUpdate > 5 * 60 * 1000) { // 5 minutes
					issues.push('Sensor data is stale (>5 minutes old)');
					recommendations.push('Check sensor connectivity and MQTT broker');
				}
			}

			// Check sensor coverage
			const expectedSensors = ['temperature', 'humidity', 'soilMoisture', 'waterLevel'];
			const missingSensors = expectedSensors.filter(s => !status.sensorData.sensorsActive.includes(s));
			if (missingSensors.length > 0) {
				issues.push(`Missing sensor data: ${missingSensors.join(', ')}`);
				recommendations.push('Check physical sensor connections');
			}

			// Determine overall health
			let overall: 'healthy' | 'degraded' | 'critical';
			if (issues.length === 0) {
				overall = 'healthy';
			} else if (issues.some(issue =>
				issue.includes('not configured') ||
				issue.includes('not active') ||
				issue.includes('No sensor data')
			)) {
				overall = 'critical';
			} else {
				overall = 'degraded';
			}

			console.log(`🏥 [${healthCheckId}] Health check completed - Status: ${overall.toUpperCase()}`);
			if (issues.length > 0) {
				console.log(`⚠️ [${healthCheckId}] Issues found:`, issues);
			}

			return {
				overall,
				details: status,
				issues,
				recommendations
			};

		} catch (error) {
			console.error(`❌ [${healthCheckId}] Error performing health check:`, error);
			return {
				overall: 'critical',
				details: {
					emailService: { configured: false, ready: false },
					alertService: { active: false, thresholdsLoaded: false },
					recentAlerts: { count: 0, types: [] },
					sensorData: { sensorsActive: [] }
				},
				issues: ['Health check system failure'],
				recommendations: ['Check system logs and restart services']
			};
		}
	}

	/**
	 * Mark that an alert check was performed (for monitoring)
	 */
	static markAlertCheckPerformed(): void {
		this.lastAlertCheck = new Date();
	}
}
