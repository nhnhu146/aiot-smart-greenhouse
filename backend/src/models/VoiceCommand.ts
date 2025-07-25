import mongoose, { Document, Schema } from 'mongoose';

export interface IVoiceCommand extends Document {
	command: string;
	confidence: number;
	timestamp: Date;
	processed: boolean;
	response?: string;
	errorMessage?: string;
}

const VoiceCommandSchema = new Schema<IVoiceCommand>({
	command: {
		type: String,
		required: true,
		trim: true
	},
	confidence: {
		type: Number,
		required: true,
		min: 0,
		max: 1
	},
	timestamp: {
		type: Date,
		default: Date.now
	},
	processed: {
		type: Boolean,
		default: false
	},
	response: {
		type: String,
		trim: true
	},
	errorMessage: {
		type: String,
		trim: true
	}
}, {
	timestamps: true
});

VoiceCommandSchema.index({ timestamp: -1 });
VoiceCommandSchema.index({ processed: 1 });

export default mongoose.model<IVoiceCommand>('VoiceCommand', VoiceCommandSchema);
