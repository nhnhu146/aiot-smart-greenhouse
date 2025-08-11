/**
 * Test script to verify all email templates render correctly with complete data
 */
import { EmailService, AlertEmailData } from '../services/EmailService';

async function testEmailTemplates() {
	console.log('🧪 Testing email templates with complete data...\n');

	const emailService = new EmailService();

	// Test 1: Alert Email
	console.log('1. Testing Alert Email Template...');
	const alertData: AlertEmailData = {
		alertType: 'Temperature Alert',
		deviceType: 'Temperature Sensor',
		currentValue: 32.5,
		threshold: 30,
		timestamp: new Date().toISOString(),
		severity: 'high'
	};

	try {
		const result1 = await emailService.sendAlertEmail(alertData, ['test@example.com']);
		console.log(`   ✅ Alert email: ${result1 ? 'SUCCESS' : 'FAILED'}`);
	} catch (error) {
		console.log(`   ❌ Alert email: FAILED - ${error instanceof Error ? error.message : String(error)}`);
	}

	// Test 2: Batch Alert Email
	console.log('2. Testing Batch Alert Email Template...');
	const batchAlerts = [
		{
			alertType: 'Temperature Alert',
			deviceType: 'Temperature Sensor',
			currentValue: 32.5,
			threshold: 30,
			timestamp: new Date().toISOString(),
			level: 'high',
			message: 'Temperature exceeded safe threshold'
		},
		{
			alertType: 'Humidity Alert',
			deviceType: 'Humidity Sensor',
			currentValue: 85,
			threshold: 80,
			timestamp: new Date().toISOString(),
			level: 'medium',
			message: 'Humidity level needs attention'
		},
		{
			alertType: 'Soil Moisture Alert',
			deviceType: 'Soil Moisture Sensor',
			currentValue: 25,
			threshold: 40,
			timestamp: new Date().toISOString(),
			level: 'critical',
			message: 'Soil moisture critically low'
		}
	];

	try {
		const result2 = await emailService.sendBatchAlertEmail(batchAlerts, ['test@example.com']);
		console.log(`   ✅ Batch alert email: ${result2 ? 'SUCCESS' : 'FAILED'}`);
	} catch (error) {
		console.log(`   ❌ Batch alert email: FAILED - ${error instanceof Error ? error.message : String(error)}`);
	}

	// Test 3: Password Reset Email
	console.log('3. Testing Password Reset Email Template...');
	try {
		const result3 = await emailService.sendPasswordResetEmail('test@example.com', 'test-reset-token-123');
		console.log(`   ✅ Password reset email: ${result3 ? 'SUCCESS' : 'FAILED'}`);
	} catch (error) {
		console.log(`   ❌ Password reset email: FAILED - ${error instanceof Error ? error.message : String(error)}`);
	}

	// Test 4: Test Email
	console.log('4. Testing Test Email Template...');
	try {
		const result4 = await emailService.sendTestEmail(['test@example.com']);
		console.log(`   ✅ Test email: ${result4 ? 'SUCCESS' : 'FAILED'}`);
	} catch (error) {
		console.log(`   ❌ Test email: FAILED - ${error instanceof Error ? error.message : String(error)}`);
	}

	console.log('\n🏁 Email template testing completed!');

	// Show email service status
	const status = emailService.getStatus();
	console.log(`\n📊 Email Service Status:
    - Configured: ${status.configured}
    - Ready: ${status.ready}
    - Connection: ${await emailService.testConnection()}
    `);
}

// Run the test if this file is executed directly
if (require.main === module) {
	testEmailTemplates().catch(console.error);
}

export { testEmailTemplates };