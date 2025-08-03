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
	resolved: boolean;
	acknowledged?: boolean;
	acknowledgedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
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
	resolved: {
		type: Boolean,
		default: false
	},
	acknowledged: {
		type: Boolean,
		default: false
	},
	acknowledgedAt: {
		type: Date
	}
}, {
	timestamps: true // Use MongoDB's createdAt/updatedAt instead of custom timestamp
});;

const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

// Thêm export default để khớp với cách import trong index.ts
export default Alert;
// Vẫn giữ named export cho các file đang sử dụng
export { Alert };
