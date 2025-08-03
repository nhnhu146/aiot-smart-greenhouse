import mongoose, { Document, Schema } from 'mongoose';

export interface IVoiceCommand extends Document {
	command: string;
	confidence: number | null;
	processed: boolean;
	errorMessage?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const VoiceCommandSchema = new Schema<IVoiceCommand>({
	command: {
		type: String,
		required: true,
		trim: true
	},
	confidence: {
		type: Number,
		required: false,
		min: 0,
		max: 1,
		default: null
	},
	processed: {
		type: Boolean,
		default: false
	},
	errorMessage: {
		type: String,
		trim: true
	}
}, {
	timestamps: true // Use MongoDB's createdAt/updatedAt instead of custom timestamp
});;

VoiceCommandSchema.index({ createdAt: -1 });
VoiceCommandSchema.index({ processed: 1 });

export default mongoose.model<IVoiceCommand>('VoiceCommand', VoiceCommandSchema);
