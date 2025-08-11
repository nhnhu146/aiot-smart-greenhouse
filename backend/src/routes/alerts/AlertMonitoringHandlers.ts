import { Request, Response } from 'express';
import { AlertSystemMonitor } from '../../services/alert/AlertSystemMonitor';
import { APIResponse } from '../../types';

/**
 * Alert System Monitoring Handlers
 * Provides endpoints to monitor alert system health and test functionality
 */
export class AlertMonitoringHandlers {

	/**
	 * Get comprehensive alert system status
	 */
	static async getSystemStatus(req: Request, res: Response) {
		try {
			const status = await AlertSystemMonitor.getSystemStatus();

			const response: APIResponse = {
				success: true,
				data: status,
				message: 'Alert system status retrieved successfully',
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			const response: APIResponse = {
				success: false,
				error: 'Failed to get alert system status',
				message: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};

			res.status(500).json(response);
		}
	}

	/**
	 * Perform comprehensive health check
	 */
	static async performHealthCheck(req: Request, res: Response) {
		try {
			const healthCheck = await AlertSystemMonitor.performHealthCheck();

			const response: APIResponse = {
				success: true,
				data: healthCheck,
				message: `Alert system health: ${healthCheck.overall.toUpperCase()}`,
				timestamp: new Date().toISOString()
			};

			// Set appropriate HTTP status based on health
			const statusCode = healthCheck.overall === 'healthy' ? 200 :
				healthCheck.overall === 'degraded' ? 207 : 503;

			res.status(statusCode).json(response);
		} catch (error) {
			const response: APIResponse = {
				success: false,
				error: 'Health check failed',
				message: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};

			res.status(500).json(response);
		}
	}

	/**
	 * Test email notification system
	 */
	static async testEmailSystem(req: Request, res: Response) {
		try {
			const testResult = await AlertSystemMonitor.testEmailSystem();

			const response: APIResponse = {
				success: testResult,
				data: {
					emailTest: testResult,
					testedAt: new Date().toISOString()
				},
				message: testResult ? 'Email system test successful' : 'Email system test failed',
				timestamp: new Date().toISOString()
			};

			res.status(testResult ? 200 : 500).json(response);
		} catch (error) {
			const response: APIResponse = {
				success: false,
				error: 'Email test failed',
				message: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};

			res.status(500).json(response);
		}
	}

	/**
	 * Test alert checking system
	 */
	static async testAlertChecking(req: Request, res: Response) {
		try {
			const testResult = await AlertSystemMonitor.testAlertChecking();

			const response: APIResponse = {
				success: testResult,
				data: {
					alertTest: testResult,
					testedAt: new Date().toISOString()
				},
				message: testResult ? 'Alert checking test successful' : 'Alert checking test failed',
				timestamp: new Date().toISOString()
			};

			res.status(testResult ? 200 : 500).json(response);
		} catch (error) {
			const response: APIResponse = {
				success: false,
				error: 'Alert checking test failed',
				message: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};

			res.status(500).json(response);
		}
	}
}
