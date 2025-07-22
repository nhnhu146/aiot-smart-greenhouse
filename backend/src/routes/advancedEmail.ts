import express from 'express';
import { AdvancedEmailService } from '../services/AdvancedEmailService';

const router = express.Router();
const advancedEmailService = new AdvancedEmailService();

// Test advanced email system
router.post('/test-advanced', async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(400).json({
				success: false,
				message: 'Email address is required'
			});
			return;
		}

		console.log(`📧 Testing advanced email system for: ${email}`);

		const result = await advancedEmailService.sendTestEmail(email);

		res.json({
			success: result,
			message: result ? 'Advanced email test sent successfully!' : 'Failed to send advanced email test',
			service: 'AdvancedEmailService',
			features: [
				'Connection pooling',
				'CSS inline processing',
				'Both HTML and text versions',
				'Map-based template replacement',
				'Professional responsive design'
			]
		});
	} catch (error) {
		console.error('❌ Advanced email test failed:', error);
		res.status(500).json({
			success: false,
			message: 'Advanced email test failed',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});// Test alert email with enhanced template
router.post('/test-alert-advanced', async (req, res) => {
	try {
		const { email, sensorType = 'Soil Moisture', value = 'Dry', threshold = 'Wet' } = req.body;

		if (!email) {
			res.status(400).json({
				success: false,
				message: 'Email address is required'
			});
			return;
		}

		console.log(`📧 Testing advanced alert email for: ${email}`);

		const result = await advancedEmailService.sendAlertEmail(
			email,
			'🌱 Smart Greenhouse - Enhanced Alert System Test',
			sensorType,
			value,
			threshold
		);

		res.json({
			success: result,
			message: result ? 'Advanced alert email sent successfully!' : 'Failed to send advanced alert email',
			alertDetails: {
				sensor: sensorType,
				value,
				threshold,
				template: 'enhanced-alert-email.html'
			}
		});
	} catch (error) {
		console.error('❌ Advanced alert email test failed:', error);
		res.status(500).json({
			success: false,
			message: 'Advanced alert email test failed',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Get advanced email service status
router.get('/status-advanced', async (req, res) => {
	try {
		const status = advancedEmailService.getStatus();

		res.json({
			success: true,
			service: 'AdvancedEmailService',
			status,
			features: {
				connectionPooling: status.poolingEnabled,
				cssInline: true,
				multipleFormats: true,
				mapBasedReplacements: true,
				responsiveDesign: true
			}
		});
	} catch (error) {
		console.error('❌ Failed to get advanced email status:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get advanced email status',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

export default router;
