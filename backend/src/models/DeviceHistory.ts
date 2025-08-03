import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceHistory extends Document {
	deviceId: string;
	deviceType: 'light' | 'pump' | 'door' | 'window';
	action: 'on' | 'off' | 'open' | 'close';
	status: boolean; // true = on/open, false = off/close
	controlType: 'auto' | 'manual';
	triggeredBy?: string; // sensor value that triggered auto control
	userId?: string; // for manual control
	duration?: number; // in seconds, for pump
	sensorValue?: number; // value that triggered the action
	success: boolean;
	errorMessage?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const DeviceHistorySchema: Schema = new Schema({
	deviceId: {
		type: String,
		required: true,
		index: true
	},
	deviceType: {
		type: String,
		required: true,
		enum: ['light', 'pump', 'door', 'window'],
		index: true
	},
	action: {
		type: String,
		required: true,
		enum: ['on', 'off', 'open', 'close']
	},
	status: {
		type: Boolean,
		required: true
	},
	controlType: {
		type: String,
		required: true,
		enum: ['auto', 'manual'],
		index: true
	},
	triggeredBy: {
		type: String,
		required: false // sensor name for auto control
	},
	userId: {
		type: String,
		required: false // for manual control tracking
	},
	duration: {
		type: Number,
		required: false,
		min: 0,
		max: 3600 // max 1 hour
	},
	sensorValue: {
		type: Number,
		required: false // sensor value that triggered auto action
	},
	success: {
		type: Boolean,
		default: true
	},
	errorMessage: {
		type: String,
		required: false
	}
}, {
	timestamps: true, // Use MongoDB's createdAt/updatedAt instead of custom timestamp
	versionKey: false
});;

// Indexes for efficient queries
DeviceHistorySchema.index({ createdAt: -1 }); // Time-based queries
DeviceHistorySchema.index({ deviceType: 1, createdAt: -1 }); // Device-specific history
DeviceHistorySchema.index({ controlType: 1, createdAt: -1 }); // Auto vs manual queries
DeviceHistorySchema.index({ deviceId: 1, controlType: 1, createdAt: -1 }); // Composite queries

export default mongoose.model<IDeviceHistory>('DeviceHistory', DeviceHistorySchema);
