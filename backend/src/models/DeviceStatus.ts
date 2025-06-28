import mongoose, { Schema, Document } from 'mongoose';
import { DeviceStatus } from '../types';

export interface IDeviceStatus extends Omit<DeviceStatus, '_id'>, Document { }

const DeviceStatusSchema: Schema = new Schema({
	deviceId: {
		type: String,
		required: true,
		unique: true
	},
	deviceType: {
		type: String,
		required: true,
		enum: ['light', 'pump', 'door', 'window', 'servo']
	},
	status: {
		type: Boolean,
		required: true,
		default: false
	},
	// Remove lastUpdated since we use updatedAt from timestamps
	// Additional fields for better device management
	isOnline: {
		type: Boolean,
		default: true
	},
	errorCount: {
		type: Number,
		default: 0
	},
	lastCommand: {
		type: String,
		default: null
	}
}, {
	timestamps: true, // This creates createdAt and updatedAt automatically
	versionKey: false
});

// Optimized indexes for better query performance
DeviceStatusSchema.index({ deviceId: 1 });
DeviceStatusSchema.index({ deviceType: 1 });
DeviceStatusSchema.index({ updatedAt: -1 }); // For recent activity queries
DeviceStatusSchema.index({ deviceType: 1, status: 1 }); // For device type and status queries

export default mongoose.model<IDeviceStatus>('DeviceStatus', DeviceStatusSchema);
