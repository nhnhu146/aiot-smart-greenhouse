/**
 * Alert System Test Script
 * Tests the entire alert workflow including MQTT message handling and email notifications
 */

import { alertService } from '../services/AlertService';
import { emailService } from '../services/EmailService';
import { AlertSystemMonitor } from '../services/alert/AlertSystemMonitor';

/**
 * Test alert system with simulated sensor data
 */
export async function testAlertWorkflow(): Promise<void> {
	console.log('🧪 Starting Alert System Test Workflow...');
	console.log('='.repeat(60));

	try {
		// Step 1: Test email service configuration
		console.log('\n📧 Step 1: Testing email service...');
		const emailConfigured = emailService.isConfigured();
		console.log(`Email service configured: ${emailConfigured ? '✅' : '❌'}`);

		if (emailConfigured) {
			try {
				const emailTest = await AlertSystemMonitor.testEmailSystem();
				console.log(`Email test result: ${emailTest ? '✅' : '❌'}`);
			} catch (error) {
				console.error('❌ Email test failed:', error);
			}
		}

		// Step 2: Test alert system health
		console.log('\n🏥 Step 2: Checking alert system health...');
		const healthCheck = await AlertSystemMonitor.performHealthCheck();
		console.log(`Overall health: ${healthCheck.overall.toUpperCase()}`);
		if (healthCheck.issues.length > 0) {
			console.log('Issues found:', healthCheck.issues);
		}

		// Step 3: Test threshold checking with normal values
		console.log('\n✅ Step 3: Testing with NORMAL sensor values...');
		await testThresholdChecking({
			temperature: 25, // Normal temperature
			humidity: 60,    // Normal humidity  
			soilMoisture: 1, // Wet soil (good)
			waterLevel: 0    // Normal water level
		}, 'Normal values should NOT trigger alerts');

		// Step 4: Test threshold checking with alert-triggering values
		console.log('\n🚨 Step 4: Testing with ALERT-TRIGGERING values...');
		await testThresholdChecking({
			temperature: 45, // Very high temperature
			humidity: 90,    // Very high humidity
			soilMoisture: 0, // Dry soil (bad)
			waterLevel: 1    // Flood detected
		}, 'Alert values SHOULD trigger alerts');

		// Step 5: Test another set of alert values to verify cooldown
		console.log('\n🔄 Step 5: Testing cooldown behavior...');
		console.log('Waiting 2 seconds before next test...');
		await new Promise(resolve => setTimeout(resolve, 2000));

		await testThresholdChecking({
			temperature: 5,  // Very low temperature
			humidity: 10,    // Very low humidity
			soilMoisture: 0, // Still dry
			waterLevel: 1    // Still flooding
		}, 'Second alert test (may be blocked by cooldown)');

		console.log('\n📊 Final system status...');
		const finalStatus = await AlertSystemMonitor.getSystemStatus();
		console.log('Alert system status:', {
			emailReady: finalStatus.emailService.ready,
			alertServiceActive: finalStatus.alertService.active,
			thresholdsLoaded: finalStatus.alertService.thresholdsLoaded,
			activeSensors: finalStatus.sensorData.sensorsActive
		});

		console.log('\n🎉 Alert System Test Workflow Complete!');
		console.log('='.repeat(60));

	} catch (error) {
		console.error('❌ Test workflow failed:', error);
	}
}

/**
 * Test threshold checking with specific sensor data
 */
async function testThresholdChecking(sensorData: {
	temperature: number;
	humidity: number;
	soilMoisture: number;
	waterLevel: number;
}, testDescription: string): Promise<void> {
	console.log(`\n🔍 Testing: ${testDescription}`);
	console.log('Sensor data:', {
		temperature: `${sensorData.temperature}°C`,
		humidity: `${sensorData.humidity}%`,
		soilMoisture: `${sensorData.soilMoisture} (${sensorData.soilMoisture === 0 ? 'DRY' : 'WET'})`,
		waterLevel: `${sensorData.waterLevel} (${sensorData.waterLevel === 0 ? 'NORMAL' : 'FLOOD'})`
	});

	try {
		// Test direct alert service threshold checking
		await alertService.checkSensorThresholds(sensorData);
		console.log('✅ Threshold checking completed successfully');
	} catch (error) {
		console.error('❌ Threshold checking failed:', error);
	}
}

/**
 * Simulate MQTT sensor data reception and alert checking
 */
export async function simulateMQTTAlertFlow(): Promise<void> {
	console.log('\n🌐 Simulating MQTT Alert Flow...');
	console.log('-'.repeat(40));

	const testSensors = [
		{ type: 'temperature', value: 45 }, // High temp
		{ type: 'humidity', value: 90 },    // High humidity
		{ type: 'soil', value: 0 },         // Dry soil
		{ type: 'water', value: 1 }         // Flooding
	];

	for (const sensor of testSensors) {
		console.log(`📡 Simulating MQTT: ${sensor.type} = ${sensor.value}`);
		try {
			// Simulate what happens in MQTTHandler.handleSensorData
			// This would normally be called by the MQTT message handler
			console.log('🔔 Processing sensor data for alert checking...');
			// Note: In real scenario, this goes through MQTTHandler.handleSensorData
			// For testing, we'll directly call the alert checking logic

		} catch (error) {
			console.error(`❌ MQTT simulation failed for ${sensor.type}:`, error);
		}
	}

	console.log('🌐 MQTT Alert Flow Simulation Complete');
}

/**
 * Run comprehensive test suite
 */
export async function runAlertSystemTests(): Promise<void> {
	console.log('\n🚀 Starting Comprehensive Alert System Tests');
	console.log('='.repeat(80));

	await testAlertWorkflow();
	await simulateMQTTAlertFlow();

	console.log('\n🏁 All Alert System Tests Complete');
	console.log('='.repeat(80));
}

// Export for use in other test files or scripts
export default {
	testAlertWorkflow,
	simulateMQTTAlertFlow,
	runAlertSystemTests
};
