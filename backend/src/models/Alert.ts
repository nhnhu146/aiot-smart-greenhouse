import mongoose, { Document } from 'mongoose';

export interface IAlert extends Document {
	type: 'temperature' | 'humidity' | 'soilMoisture' | 'waterLevel' | 'device' | 'system';
	level: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	value?: number;
	threshold?: {
		min?: number;
		max?: number;
	};
	deviceType?: string;
	timestamp: Date;
	resolved: boolean;
}

const AlertSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'device', 'system'],
		required: true
	},
	level: {
		type: String,
		enum: ['low', 'medium', 'high', 'critical'],
		required: true
	},
	message: {
		type: String,
		required: true
	},
	value: {
		type: Number
	},
	threshold: {
		min: Number,
		max: Number
	},
	deviceType: String,
	timestamp: {
		type: Date,
		default: Date.now
	},
	resolved: {
		type: Boolean,
		default: false
	}
});

const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

// Thêm export default để khớp với cách import trong index.ts
export default Alert;
// Vẫn giữ named export cho các file đang sử dụng
export { Alert };
