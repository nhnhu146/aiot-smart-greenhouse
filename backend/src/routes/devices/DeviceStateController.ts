import { Request, Response } from 'express';
import { DeviceStatus } from '../../models';
import { APIResponse } from '../../types';
import { AppError } from '../../middleware';
import { webSocketService } from '../../services';

export class DeviceStateController {
	/**
	 * GET /api/devices/states - Get all device states
	 */
	static async getAllStates(req: Request, res: Response): Promise<void> {
		try {
			const devices = await DeviceStatus.find().lean();
			
			const deviceStates = devices.reduce((acc: any, device) => {
				acc[device.deviceType] = {
					status: device.status,
					isOnline: device.isOnline,
					lastCommand: device.lastCommand,
					updatedAt: device.updatedAt
				};
				return acc;
			}, {});

			const response: APIResponse = {
				success: true,
				message: 'Device states retrieved successfully',
				data: deviceStates,
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error('Error retrieving device states:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to retrieve device states',
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * GET /api/devices/states/:deviceType - Get specific device state
	 */
	static async getDeviceState(req: Request, res: Response): Promise<void> {
		try {
			const { deviceType } = req.params;

			if (!['light', 'pump', 'door', 'window'].includes(deviceType)) {
				throw new AppError('Invalid device type', 400);
			}

			const device = await DeviceStatus.findOne({ deviceType }).lean();

			if (!device) {
				// Create default state if not exists
				const defaultDevice = await DeviceStatus.create({
					deviceId: `greenhouse_${deviceType}`,
					deviceType,
					status: false,
					isOnline: true,
					errorCount: 0,
					lastCommand: null
				});

				const response: APIResponse = {
					success: true,
					message: `${deviceType} state retrieved successfully`,
					data: {
						status: defaultDevice.status,
						isOnline: defaultDevice.isOnline,
						lastCommand: defaultDevice.lastCommand,
						updatedAt: defaultDevice.updatedAt
					},
					timestamp: new Date().toISOString()
				};

				res.json(response);
				return;
			}

			const response: APIResponse = {
				success: true,
				message: `${deviceType} state retrieved successfully`,
				data: {
					status: device.status,
					isOnline: device.isOnline,
					lastCommand: device.lastCommand,
					updatedAt: device.updatedAt
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error(`Error retrieving ${req.params.deviceType} state:`, error);
			res.status(500).json({
				success: false,
				message: `Failed to retrieve ${req.params.deviceType} state`,
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * PUT /api/devices/states/:deviceType - Update device state
	 */
	static async updateDeviceState(req: Request, res: Response): Promise<void> {
		try {
			const { deviceType } = req.params;
			const { status, lastCommand } = req.body;

			if (!['light', 'pump', 'door', 'window'].includes(deviceType)) {
				throw new AppError('Invalid device type', 400);
			}

			if (typeof status !== 'boolean') {
				throw new AppError('Status must be a boolean value', 400);
			}

			const updateData: any = {
				deviceId: `greenhouse_${deviceType}`,
				deviceType,
				status,
				isOnline: true,
				lastCommand: lastCommand || (status ? 'on' : 'off')
			};

			const device = await DeviceStatus.findOneAndUpdate(
				{ deviceType },
				updateData,
				{ upsert: true, new: true }
			);

			// Broadcast state change via WebSocket
			webSocketService.broadcastDeviceStatus(deviceType, {
				device: deviceType,
				status: status ? 'on' : 'off',
				timestamp: new Date().toISOString()
			});

			const response: APIResponse = {
				success: true,
				message: `${deviceType} state updated successfully`,
				data: {
					status: device.status,
					isOnline: device.isOnline,
					lastCommand: device.lastCommand,
					updatedAt: device.updatedAt
				},
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error(`Error updating ${req.params.deviceType} state:`, error);
			res.status(500).json({
				success: false,
				message: `Failed to update ${req.params.deviceType} state`,
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * POST /api/devices/states/sync - Force sync all device states via WebSocket
	 */
	static async syncAllStates(req: Request, res: Response): Promise<void> {
		try {
			const devices = await DeviceStatus.find().lean();
			
			// Broadcast all device states
			for (const device of devices) {
				webSocketService.broadcastDeviceStatus(device.deviceType, {
					device: device.deviceType,
					status: device.status ? 'on' : 'off',
					timestamp: new Date().toISOString()
				});
			}

			const response: APIResponse = {
				success: true,
				message: 'Device states synchronized successfully',
				data: { synced: devices.length },
				timestamp: new Date().toISOString()
			};

			res.json(response);
		} catch (error) {
			console.error('Error syncing device states:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to sync device states',
				timestamp: new Date().toISOString()
			});
		}
	}
}
