import mongoose, { Schema, Document } from 'mongoose';
import { SensorData } from '../types';

export interface ISensorData extends Omit<SensorData, '_id'>, Document { }

const SensorDataSchema: Schema = new Schema({
	timestamp: {
		type: Date,
		required: true,
		default: Date.now
	},
	temperature: {
		type: Number,
		required: true,
		min: -50,
		max: 100
	},
	humidity: {
		type: Number,
		required: true,
		min: 0,
		max: 100
	},
	soilMoisture: {
		type: Number,
		required: true,
		min: 0,
		max: 100
	},
	waterLevel: {
		type: Number,
		required: true,
		min: 0,
		max: 100
	},
	plantHeight: {
		type: Number,
		required: true,
		min: 0
	},
	rainStatus: {
		type: Boolean,
		required: true,
		default: false
	}
}, {
	timestamps: true,
	versionKey: false
});

// Index for better query performance
SensorDataSchema.index({ timestamp: -1 });
SensorDataSchema.index({ createdAt: -1 });

export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);
