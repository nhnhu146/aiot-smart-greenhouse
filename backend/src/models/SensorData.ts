import mongoose, { Schema, Document } from 'mongoose';
import { SensorData } from '../types';

export interface ISensorData extends Omit<SensorData, '_id'>, Document { }

const SensorDataSchema: Schema = new Schema({
	// Remove custom timestamp field to use MongoDB's default createdAt/updatedAt
	temperature: {
		type: Number,
		required: false, // Allow partial data saves
		min: -50,
		max: 100,
		default: null
	},
	humidity: {
		type: Number,
		required: false, // Allow partial data saves
		min: 0,
		max: 100,
		default: null
	},
	soilMoisture: {
		type: Number,
		required: false, // Allow partial data saves
		min: 0,
		max: 1024, // ADC range for analog sensors
		default: null
	},
	waterLevel: {
		type: Number,
		required: false, // Allow partial data saves
		min: 0,
		max: 100,
		default: null
	},
	plantHeight: {
		type: Number,
		required: false, // Allow partial data saves
		min: 0,
		max: 500, // cm
		default: null
	},
	rainStatus: {
		type: Boolean,
		required: false, // Allow partial data saves
		default: null
	},
	lightLevel: {
		type: Number,
		required: false,
		min: 0,
		max: 4095, // ADC range for ESP32
		default: null
	},
	motionDetected: {
		type: Boolean,
		required: false,
		default: null
	},
	// Device identifier for tracking data source
	deviceId: {
		type: String,
		default: 'esp32-greenhouse-01'
	},
	// Data quality indicator
	dataQuality: {
		type: String,
		enum: ['complete', 'partial', 'error'],
		default: 'partial'
	}
}, {
	timestamps: true, // This creates createdAt and updatedAt automatically
	versionKey: false
});

// Optimized indexes for better query performance
SensorDataSchema.index({ createdAt: -1 }); // Primary time-based queries
SensorDataSchema.index({ deviceId: 1, createdAt: -1 }); // Device-specific time queries
SensorDataSchema.index({ dataQuality: 1, createdAt: -1 }); // Quality-based queries
SensorDataSchema.index({
	temperature: 1,
	humidity: 1,
	soilMoisture: 1,
	createdAt: -1
}, {
	sparse: true, // Only index documents with these fields
	name: "sensor_data_composite"
});
SensorDataSchema.index({ motionDetected: 1, createdAt: -1 }, { sparse: true }); // Motion detection queries

export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);
