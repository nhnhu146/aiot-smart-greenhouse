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
		enum: ['light', 'pump', 'door']
	},
	status: {
		type: Boolean,
		required: true,
		default: false
	},
	lastUpdated: {
		type: Date,
		required: true,
		default: Date.now
	}
}, {
	timestamps: true,
	versionKey: false
});

// Index for better query performance
DeviceStatusSchema.index({ deviceId: 1 });
DeviceStatusSchema.index({ deviceType: 1 });

export default mongoose.model<IDeviceStatus>('DeviceStatus', DeviceStatusSchema);
