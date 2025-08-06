import mongoose, { Document, Schema } from 'mongoose';
export interface IPasswordReset extends Document {
	email: string
	token: string
	expiresAt: Date
	used: boolean
	createdAt: Date
}

const PasswordResetSchema = new Schema<IPasswordReset>({
	email: {
		type: String,
		required: true,
		lowercase: true,
		trim: true
	},
	token: {
		type: String,
		required: true,
		unique: true
	},
	expiresAt: {
		type: Date,
		required: true,
		index: { expireAfterSeconds: 0 } // Auto delete expired documents
	},
	used: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});
// Index for efficient queries
PasswordResetSchema.index({ email: 1, used: 1 });
PasswordResetSchema.index({ token: 1 });
export default mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);