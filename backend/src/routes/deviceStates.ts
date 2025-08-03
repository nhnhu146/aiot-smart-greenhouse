import express from 'express';
import { DeviceStatus } from '../models';
import { webSocketService } from '../services';

const router = express.Router();

// GET /api/devices/states - Get all device states
router.get('/states', async (req, res) => {
	try {
		const deviceStates = await DeviceStatus.find({});

		const statesMap: any = {};
		deviceStates.forEach(device => {
			statesMap[device.deviceType] = {
				status: device.status,
				isOnline: device.isOnline,
				lastCommand: device.lastCommand,
				updatedAt: device.updatedAt
			};
		});

		res.json({
			success: true,
			data: statesMap
		});
	} catch (error) {
		console.error('Error fetching device states:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch device states'
		});
	}
});

// GET /api/devices/states/:deviceType - Get specific device state
router.get('/states/:deviceType', async (req, res) => {
	try {
		const { deviceType } = req.params;

		const deviceState = await DeviceStatus.findOne({ deviceType });

		if (!deviceState) {
			return res.status(404).json({
				success: false,
				message: 'Device not found'
			});
		}

		return res.json({
			success: true,
			data: {
				status: deviceState.status,
				isOnline: deviceState.isOnline,
				lastCommand: deviceState.lastCommand,
				updatedAt: deviceState.updatedAt
			}
		});
	} catch (error) {
		console.error('Error fetching device state:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch device state'
		});
	}
});

// PUT /api/devices/states/:deviceType - Update device state
router.put('/states/:deviceType', async (req, res) => {
	try {
		const { deviceType } = req.params;
		const { status, lastCommand } = req.body;

		const updateData = {
			deviceType,
			status: Boolean(status),
			isOnline: true,
			lastCommand: lastCommand || (status ? 'on' : 'off'),
			updatedAt: new Date()
		};

		const deviceState = await DeviceStatus.findOneAndUpdate(
			{ deviceType },
			updateData,
			{ upsert: true, new: true }
		);

		// Broadcast via WebSocket
		webSocketService.broadcastDeviceStatus(`greenhouse/devices/${deviceType}/status`, {
			device: deviceType,
			status: status ? 'on' : 'off',
			timestamp: new Date().toISOString()
		});

		res.json({
			success: true,
			data: {
				status: deviceState.status,
				isOnline: deviceState.isOnline,
				lastCommand: deviceState.lastCommand,
				updatedAt: deviceState.updatedAt
			}
		});
	} catch (error) {
		console.error('Error updating device state:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to update device state'
		});
	}
});

// POST /api/devices/states/sync - Sync all device states
router.post('/states/sync', async (req, res) => {
	try {
		const deviceStates = await DeviceStatus.find({});

		deviceStates.forEach(device => {
			webSocketService.broadcastDeviceStatus(`greenhouse/devices/${device.deviceType}/status`, {
				device: device.deviceType,
				status: device.status ? 'on' : 'off',
				timestamp: new Date().toISOString()
			});
		});

		res.json({
			success: true,
			message: 'Device states synced successfully'
		});
	} catch (error) {
		console.error('Error syncing device states:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to sync device states'
		});
	}
});

export default router;
