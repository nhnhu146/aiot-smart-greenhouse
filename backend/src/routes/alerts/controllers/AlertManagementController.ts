import { Request, Response } from 'express';
import { Alert } from '../../../models';
import { APIResponse } from '../../../types';
import { AppError } from '../../../middleware';
export class AlertManagementController {
	/**
	 * Create new alert
	 */
	static async createAlert(req: Request, res: Response) {
		const alertData = req.body;
		const alert = new Alert({
			...alertData,
			timestamp: new Date(),
			resolved: false
		});
		await alert.save();
		const response: APIResponse = {
			success: true,
			message: 'Alert created successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};
		res.status(201).json(response);
	}

	/**
	 * Resolve alert by ID
	 */
	static async resolveAlert(req: Request, res: Response) {
		const { id } = req.params;
		const alert = await Alert.findByIdAndUpdate(
			id,
			{ resolved: true },
			{ new: true }
		);
		if (!alert) {
			throw new AppError('Alert not found', 404);
		}

		const response: APIResponse = {
			success: true,
			message: 'Alert resolved successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	/**
	 * Mark alert as unresolved
	 */
	static async unresolveAlert(req: Request, res: Response) {
		const { id } = req.params;
		const alert = await Alert.findByIdAndUpdate(
			id,
			{ resolved: false },
			{ new: true }
		);
		if (!alert) {
			throw new AppError('Alert not found', 404);
		}

		const response: APIResponse = {
			success: true,
			message: 'Alert marked as unresolved successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	/**
	 * Delete alert by ID
	 */
	static async deleteAlert(req: Request, res: Response) {
		const { id } = req.params;
		const alert = await Alert.findByIdAndDelete(id);
		if (!alert) {
			throw new AppError('Alert not found', 404);
		}

		const response: APIResponse = {
			success: true,
			message: 'Alert deleted successfully',
			data: alert,
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}

	/**
	 * Resolve all unresolved alerts
	 */
	static async resolveAllAlerts(req: Request, res: Response) {
		const result = await Alert.updateMany(
			{ resolved: false },
			{ resolved: true }
		);
		const response: APIResponse = {
			success: true,
			message: `${result.modifiedCount} alerts resolved successfully`,
			data: {
				modifiedCount: result.modifiedCount,
				matchedCount: result.matchedCount
			},
			timestamp: new Date().toISOString()
		};
		res.json(response);
	}
}
