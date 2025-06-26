import mongoose, { Schema, Document } from 'mongoose';
import { Alert } from '../types';

export interface IAlert extends Omit<Alert, '_id'>, Document { }

const AlertSchema: Schema = new Schema({
	type: {
		type: String,
		required: true,
		enum: ['warning', 'error', 'info']
	},
	message: {
		type: String,
		required: true
	},
	sensor: {
		type: String,
		required: false
	},
	value: {
		type: Number,
		required: false
	},
	threshold: {
		type: Number,
		required: false
	},
	resolved: {
		type: Boolean,
		required: true,
		default: false
	},
	timestamp: {
		type: Date,
		required: true,
		default: Date.now
	}
}, {
	timestamps: true,
	versionKey: false
});

// Index for better query performance
AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ resolved: 1 });
AlertSchema.index({ type: 1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);
